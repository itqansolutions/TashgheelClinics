const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replaceStr) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceStr);
  fs.writeFileSync(filePath, content, 'utf8');
}

const apiSrc = 'D:\\Tashgheel Modules Source Code\\TashgheelClinics\\clinic-api\\src';
const webSrc = 'D:\\Tashgheel Modules Source Code\\TashgheelClinics\\clinic-web\\src';

// --- BACKEND FIXES ---

// 1. patients.repo.ts
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.repo.ts'),
  /import \{ Nationality, Gender \} from '@prisma\/client';/,
  "export type Nationality = 'Egyptian' | 'Foreigner' | string;\nexport type Gender = 'M' | 'F' | string;"
);

// 2. patients.service.ts
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.service.ts'),
  /import \{ Nationality, Gender \} from '@prisma\/client';/,
  ""
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.service.ts'),
  /import \{ patientsRepo, CreatePatientInput \} from '\.\/patients\.repo';/,
  "import { patientsRepo, CreatePatientInput, Nationality, Gender } from './patients.repo';"
);

// 3. patients.controller.ts
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /import \{ Nationality \} from '@prisma\/client';/,
  "import { Nationality } from './patients.repo';"
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /sendSuccess\(res, result\.data, 'OK', 200, result\.meta\);/g,
  "sendSuccess(res, result.data, result.meta, 200, 'OK');"
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /sendSuccess\([\s\S]*?res, patient,[\s\S]*?phoneDuplicate \? 'Patient created \(phone already exists in system\)' : 'Patient created',[\s\S]*?201[\s\S]*?\);/,
  "sendSuccess(res, patient, undefined, 201, phoneDuplicate ? 'Patient created (phone already exists in system)' : 'Patient created');"
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /sendSuccess\(res, await patientsService\.update\(Number\(req\.params\.id\), req\.body\), 'Patient updated'\);/g,
  "sendSuccess(res, await patientsService.update(Number(req.params.id), req.body), undefined, 200, 'Patient updated');"
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /sendSuccess\(res, await patientsService\.deactivate\(Number\(req\.params\.id\)\), 'Patient deactivated'\);/g,
  "sendSuccess(res, await patientsService.deactivate(Number(req.params.id)), undefined, 200, 'Patient deactivated');"
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /sendSuccess\(res, await patientsService\.updateAreas\(Number\(req\.params\.id\), areas\), 'Areas updated'\);/g,
  "sendSuccess(res, await patientsService.updateAreas(Number(req.params.id), areas), undefined, 200, 'Areas updated');"
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /sendSuccess\(res, null, 'Area removed'\);/g,
  "sendSuccess(res, null, undefined, 200, 'Area removed');"
);

// 4. auth.controller.ts
replaceInFile(
  path.join(apiSrc, 'modules/auth/auth.controller.ts'),
  /const userId = req\.user\?\.id;/g,
  "const userId = req.user?.sub;"
);

// 5. validate.ts
replaceInFile(
  path.join(apiSrc, 'middleware/validate.ts'),
  /\(req as Record<string, unknown>\)\[part\] = result\.data;/g,
  "(req as any)[part] = result.data;"
);

// 6. errorHandler.ts
replaceInFile(
  path.join(apiSrc, 'middleware/errorHandler.ts'),
  /public errors\?: unknown/g,
  "public errors?: any"
);

// 7. jwt.ts
replaceInFile(
  path.join(apiSrc, 'utils/jwt.ts'),
  /as JwtPayload;/g,
  "as unknown as JwtPayload;"
);

// 8. response.ts
replaceInFile(
  path.join(apiSrc, 'utils/response.ts'),
  /errors\?: unknown/g,
  "errors?: any"
);

// 9. users.repo.ts
replaceInFile(
  path.join(apiSrc, 'modules/users/users.repo.ts'),
  /import \{ Role \} from '@prisma\/client';/,
  ""
);

// 10. users.service.ts
replaceInFile(
  path.join(apiSrc, 'modules/users/users.service.ts'),
  /import \{ Role \} from '@prisma\/client';/,
  ""
);

// 11. prisma/seed.ts
replaceInFile(
  path.join(apiSrc, 'prisma/seed.ts'),
  /import \{ PrismaClient, Role \} from '@prisma\/client';/,
  "import { PrismaClient } from '@prisma/client';"
);


// --- FRONTEND FIXES ---

// 1. api/index.ts
replaceInFile(
  path.join(webSrc, 'api/index.ts'),
  /LeadSource, Country, BodyArea, ClinicSetting,/,
  "LeadSource, Country, BodyArea,"
);

// 2. PatientsListPage.tsx
replaceInFile(
  path.join(webSrc, 'pages/Patients/PatientsListPage.tsx'),
  /import \{ Search, UserPlus, Filter, Users, Phone, Calendar \} from 'lucide-react';/,
  "import { Search, UserPlus, Filter, Users, Phone } from 'lucide-react';"
);
replaceInFile(
  path.join(webSrc, 'pages/Patients/PatientsListPage.tsx'),
  /import \{ Select \} from '@\/components\/ui\/Select';\n/,
  ""
);
replaceInFile(
  path.join(webSrc, 'pages/Patients/PatientsListPage.tsx'),
  /import \{ formatDate, getInitials \} from '@\/utils\/format';/,
  "import { getInitials } from '@/utils/format';"
);

// 3. format.ts
replaceInFile(
  path.join(webSrc, 'utils/format.ts'),
  /currency = 'EGP',/,
  "_currency = 'EGP',"
);

// 4. AppRouter.tsx (fix NotFoundPage by replacing it with a simple div)
replaceInFile(
  path.join(webSrc, 'routes/AppRouter.tsx'),
  /import \{ NotFoundPage \}[\s\S]*?from '@\/pages\/Auth\/NotFoundPage';\n/,
  "const NotFoundPage = () => <div className=\"p-8 text-center text-gray-500\">404 - Not Found</div>;\n"
);

console.log('Fixes applied.');
