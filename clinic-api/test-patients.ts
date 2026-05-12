import { patientsService } from './src/modules/patients/patients.service';

async function test() {
  try {
    const result = await patientsService.findAll(undefined, 1, 10);
    console.log(JSON.stringify({ success: true, ...result }, null, 2));
  } catch (error) {
    console.error(error);
  }
}

test();
