import { SQSEvent } from 'aws-lambda';
import { AppDataSource } from '../utils/database';
import { Match, Prediction, Leaderboard } from '../../../entities'; 

export const handler = async (event: SQSEvent) => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const matchRepo = AppDataSource.getRepository(Match);
    const predictionRepo = AppDataSource.getRepository(Prediction);
    const leaderboardRepo = AppDataSource.getRepository(Leaderboard);

    for (const record of event.Records) {
        try {
            const { matchId } = JSON.parse(record.body);
            
            
            const match = await matchRepo.findOneBy({ id: matchId });
            
            if (!match || match.status !== 'finished') {
                console.warn(`⚠️ Partido ${matchId} no encontrado o no ha finalizado.`);
                continue;
            }

            
            const predictions = await predictionRepo.find({
                where: { match_id: match.id }
            });

            for (const pred of predictions) {
                let points = 0;

                
                const exactMatch = pred.pred_home_goals === match.home_goals && 
                                 pred.pred_home_goals === match.away_goals;
                
                const winnerMatch = Math.sign(pred.pred_home_goals - pred.pred_away_goals) === 
                                   Math.sign(match.home_goals - match.away_goals);

                if (exactMatch) points = 3;
                else if (winnerMatch) points = 1;

                
                if (points > 0) {
                    await leaderboardRepo.increment(
                        { user_id: pred.instance_player_id }, 
                        'total_points', 
                        points
                    );
                }
            }

            
            await matchRepo.update(matchId, { status: 'processed' }); 
            
        } catch (error) {
            console.error("❌ Error:", error);
            throw error; 
        }
    }
};