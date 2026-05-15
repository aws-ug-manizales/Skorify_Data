import { SQS } from 'aws-sdk';


const sqs = new SQS({ region: 'us-east-1' });


const matchId = process.argv[2];

if (!matchId) {
    console.error("❌ Error: Debes proporcionar el ID de un partido.");
    console.log("Uso sugerido: npx ts-node src/utils/force-ingest.ts [ID]");
    process.exit(1);
}

const sendMessage = async () => {
    try {
        const params = {
            
            QueueUrl: process.env.SQS_URL || 'URL_PENDIENTE_DE_CDK', 
            MessageBody: JSON.stringify({
                matchId: matchId,
                forced: true, 
                timestamp: new Date().toISOString()
            })
        };

        console.log(`📡 Enviando partido ${matchId} a la cola...`);
        
        const result = await sqs.sendMessage(params).promise();
        
        console.log(`✅ ¡Éxito! Mensaje enviado. ID del mensaje: ${result.MessageId}`);
    } catch (error) {
        console.error("💥 Error al enviar el mensaje a SQS:", error);
        process.exit(1);
    }
};

sendMessage();