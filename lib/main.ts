import { TimeService } from './services/time.service';

const fecha = TimeService.now();
console.log("Hora en Colombia:", fecha.toString());