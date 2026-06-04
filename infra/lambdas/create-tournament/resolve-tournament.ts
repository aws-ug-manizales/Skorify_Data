import { DBClient } from 'skorifydata';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { buildDbClient } from '../../utils/dbClient';

import { BuiltEntityDomainEvent } from '@skorify/domain/core';
import { TournamentEntity, MatchType } from '@skorify/domain/tournament';

import type { FootballDataCompetition } from '../../../types/football-data.types';

interface ParsedMatch {
    id: number;
    utcDate: string;
    status: string;
    matchday: number;
    homeTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
    awayTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
}

interface HandlerInput {
    matches: ParsedMatch[];
    competition: FootballDataCompetition;
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

let dbClientPromise: Promise<DBClient> | null = null;

function getDbClient(): Promise<DBClient> {
    if (!dbClientPromise) {
        dbClientPromise = buildDbClient();
    }
    return dbClientPromise;
}

export const handler = async (
    event: HandlerInput,
): Promise<{ matches: (ParsedMatch & { tournament_id: string })[] }> => {
    const { matches, competition } = event;
    const fdataId = String(competition.id);

    const table = process.env.TOURNAMENT_MAPPING_TABLE;
    if (!table) {
        throw new Error('TOURNAMENT_MAPPING_TABLE env var not set');
    }

    const { Item } = await ddb.send(
        new GetCommand({ TableName: table, Key: { fdataId } }),
    );

    let tournament_id: string;

    if (Item?.postgresId) {
        console.log(`Tournament ${fdataId} found in mapping -> ${Item.postgresId}`);
        tournament_id = Item.postgresId as string;
    } else {
        const db = await getDbClient();
        if (!competition.startDate || !competition.endDate) {
            throw new Error(
                `Competition ${competition.name} is missing season dates`,
            );
        }

        const tournament = TournamentEntity.build({
            id: crypto.randomUUID(),
            name: competition.name,
            startDate: new Date(competition.startDate),
            endDate: new Date(competition.endDate),
            matchType: MatchType.SingleMatchPerRound,
            token: competition.code,
            createdAt: new Date(),
        });

        if(!tournament.is(BuiltEntityDomainEvent)) {
            throw new Error(`Failed to build tournament entity for competition ${competition.name}`);
        }

        const created = await db.tournaments.save(tournament.payload as TournamentEntity);

        await ddb.send(
            new PutCommand({
                TableName: table,
                Item: { fdataId, postgresId: created.id },
            }),
        );

        console.log(`Tournament ${fdataId} created in postgres -> ${created.id}`);
        tournament_id = created.id;
    }

    return {
        matches: matches.map(match => ({ ...match, tournament_id })),
    };
};
