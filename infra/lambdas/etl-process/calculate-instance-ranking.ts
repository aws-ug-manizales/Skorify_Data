// import { AppDataSource } from '../utils/database';
// import { Prediction, Leaderboard } from '../../../entities'; 


export const handler = async (event: any) => {
    console.log("Calculando puntos reales para instancia:", event.id);
    
    // try {
    //     if (!AppDataSource.isInitialized) {
    //         await AppDataSource.initialize();
    //     }
        
        
    //     const { id: instance_id, match_id, final_home_goals, final_away_goals } = event;

    //     const predictionRepo = AppDataSource.getRepository(Prediction);
    //     const leaderboardRepo = AppDataSource.getRepository(Leaderboard);

        
    //     const predictions = await predictionRepo.find({ 
    //         where: { 
    //             instance_id: instance_id, 
    //             match_id: match_id 
    //         } 
    //     });

        
    //     for (const pred of predictions) {
    //         let puntosGanados = 0;

    //         // 3 puntos resultado exacto, 1 punto si solo acertó ganador/empate
    //         if (pred.home_goals === final_home_goals && pred.away_goals === final_away_goals) {
    //             puntosGanados = 3;
    //         } else if (
    //             Math.sign(pred.home_goals - pred.away_goals) === 
    //             Math.sign(final_home_goals - final_away_goals)
    //         ) {
    //             puntosGanados = 1;
    //         }

    //         if (puntosGanados > 0) {
    //             // Actualizar el leaderboard en la DB
    //             await leaderboardRepo.increment(
    //                 { instance_id: instance_id, user_id: pred.user_id }, 
    //                 "points", 
    //                 puntosGanados
    //             );
    //         }
    //     }

    //     return { 
    //         instance_id, 
    //         status: "success", 
    //         processed_at: new Date().toISOString(),
    //         match_id 
    //     };

    // } catch (error) {
    //     console.error("Error calculando ranking:", error);
    //     throw error;
    // }
};