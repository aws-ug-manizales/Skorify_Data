#!/usr/bin/env bash

set -euo pipefail

export AWS_PAGER=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
AWS_PROFILE="${AWS_PROFILE:-default}"
SSO_START_URL="https://aws-users-groups-manizales.awsapps.com/start"
SSO_REGION="${AWS_SSO_REGION:-us-east-1}"
SSO_ACCOUNT_ID="968306633562"
SSO_ROLE_NAME="InfraestructuraTeam"
REQUIRE_AUTH=false

if [[ "${1:-}" == "--require-auth" ]]; then
    REQUIRE_AUTH=true
fi

aws_cmd() {
    aws --profile "${AWS_PROFILE}" "$@"
}

get_config_value() {
    aws configure get "$1" --profile "${AWS_PROFILE}" 2>/dev/null || true
}

get_region() {
    local region="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"

    if [[ -n "${region}" ]]; then
        printf '%s' "${region}"
        return
    fi

    region="$(get_config_value region)"
    if [[ -n "${region}" ]]; then
        printf '%s' "${region}"
        return
    fi

    printf '%s' "us-east-1"
}

has_active_session() {
    aws_cmd sts get-caller-identity >/dev/null 2>&1
}

seed_known_sso_defaults() {
    aws configure set sso_start_url "${SSO_START_URL}" --profile "${AWS_PROFILE}"
    aws configure set sso_region "${SSO_REGION}" --profile "${AWS_PROFILE}"
    aws configure set sso_account_id "${SSO_ACCOUNT_ID}" --profile "${AWS_PROFILE}"
    aws configure set sso_role_name "${SSO_ROLE_NAME}" --profile "${AWS_PROFILE}"

    if [[ -z "$(get_config_value region)" ]]; then
        aws configure set region "${SSO_REGION}" --profile "${AWS_PROFILE}"
    fi
}

show_banner() {
    echo ""
    echo "==============================================="
    echo "Skorify Infraestructura - Setup AWS SSO"
    echo "==============================================="
    echo "Profile activo: ${AWS_PROFILE}"
    echo "Portal SSO configurado: ${SSO_START_URL}"
    echo "Region SSO configurada: ${SSO_REGION}"
    echo "Cuenta dev configurada: ${SSO_ACCOUNT_ID}"
    echo "Rol configurado: ${SSO_ROLE_NAME}"
}

run_bootstrap_if_needed() {
    local region
    region="$(get_region)"

    echo ""
    echo "Revisando estado de CDK Bootstrap en la cuenta actual..."

    if ! aws_cmd cloudformation describe-stacks --region "${region}" --stack-name CDKToolkit >/dev/null 2>&1; then
        echo "Stack 'CDKToolkit' no detectado. Ejecutando 'cdk bootstrap'..."
        (
            cd "${WORKSPACE_DIR}/infra"
            cdk bootstrap
        )
        echo "CDK Bootstrap completado exitosamente."
    else
        echo "El ambiente CDK (CDKToolkit) ya se encuentra inicializado."
    fi

    echo "==============================================="
}

complete_login_flow() {
    echo ""
    echo "Validando concesion de permisos temporales..."

    if has_active_session; then
        local account_id
        account_id="$(aws_cmd sts get-caller-identity --query 'Account' --output text)"
        echo "Sesion AWS activa."
        echo "Cuenta activa: ${account_id}"
        run_bootstrap_if_needed
        return 0
    fi

    echo "No fue posible confirmar una sesion valida de AWS."
    return 1
}

ensure_session() {
    seed_known_sso_defaults

    if has_active_session; then
        local account_id
        account_id="$(aws_cmd sts get-caller-identity --query 'Account' --output text)"
        echo "Sesion AWS activa."
        echo "Cuenta activa: ${account_id}"
        run_bootstrap_if_needed
        return 0
    fi

    echo "No detectamos sesion valida de AWS o tu token temporal expiro."
    echo ""
    echo "Skorify_Infraestructura usa AWS IAM Identity Center (SSO) fijo para desarrollo."
    echo "Iniciando login SSO para la cuenta dev..."
    echo ""
    aws sso login --profile "${AWS_PROFILE}"

    if complete_login_flow; then
        return 0
    fi

    if [[ "${REQUIRE_AUTH}" == true ]]; then
        echo "Se cancela la ejecucion porque AWS es obligatorio para este comando."
        return 1
    fi

    echo "No fue posible completar la autenticacion automatica."
    echo "Puedes reintentar manualmente con:"
    echo "  ./.devcontainer/scripts/setup-credentials.sh"
    return 1
}

main() {
    show_banner
    ensure_session
}

main "$@"
