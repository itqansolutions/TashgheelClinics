const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replaceStr) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(searchRegex, replaceStr);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const apiSrc = path.join(__dirname, 'clinic-api/src');
const webSrc = path.join(__dirname, 'clinic-web/src');

// --- 1. Fix Enum Imports in Backend ---

// users.repo.ts
replaceInFile(
  path.join(apiSrc, 'modules/users/users.repo.ts'),
  /import \{ Role \} from '@prisma\/client';/,
  "export type Role = 'Admin' | 'Reception' | 'Doctor' | string;"
);

// patients.repo.ts
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.repo.ts'),
  /import \{ Nationality, Gender \} from '@prisma\/client';/,
  "export type Nationality = 'Egyptian' | 'Foreigner' | string;\nexport type Gender = 'M' | 'F' | string;"
);

// patients.service.ts
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.service.ts'),
  /import \{ Nationality, Gender \} from '@prisma\/client';/,
  ""
);
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.service.ts'),
  /import \{ patientsRepo, (.*?) \} from '\.\/patients\.repo';/,
  "import { patientsRepo, $1, Nationality, Gender } from './patients.repo';"
);

// patients.controller.ts
replaceInFile(
  path.join(apiSrc, 'modules/patients/patients.controller.ts'),
  /import \{ Nationality \} from '@prisma\/client';/,
  "import { Nationality } from './patients.repo';"
);

// auth.controller.ts (sub fix)
replaceInFile(
  path.join(apiSrc, 'modules/auth/auth.controller.ts'),
  /const userId = req\.user\?\.id;/g,
  "const userId = req.user?.sub;"
);

// seed.ts
replaceInFile(
  path.join(apiSrc, 'prisma/seed.ts'),
  /import \{ PrismaClient, Role \} from '@prisma\/client';/,
  "import { PrismaClient } from '@prisma/client';"
);
replaceInFile(
  path.join(apiSrc, 'prisma/seed.ts'),
  /role: Role\.(.*?),/g,
  "role: '$1',"
);

// --- 2. Fix Vite Proxy ---
replaceInFile(
  path.join(__dirname, 'clinic-web/vite.config.ts'),
  /target: 'http:\/\/localhost:4000'/g,
  "target: 'http://localhost:5000'"
);

// --- 3. Fix Frontend Lint/TS issues ---

// api/index.ts (ClinicSetting fix)
replaceInFile(
  path.join(webSrc, 'api/index.ts'),
  /LeadSource, Country, BodyArea, ClinicSetting,/,
  "LeadSource, Country, BodyArea,"
);

// PatientsListPage.tsx
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

// AppRouter.tsx (NotFoundPage fix)
replaceInFile(
  path.join(webSrc, 'routes/AppRouter.tsx'),
  /import \{ NotFoundPage \} from '@\/pages\/Auth\/NotFoundPage';/,
  "const NotFoundPage = () => <div className=\"p-8 text-center text-gray-500\">404 - Not Found</div>;"
);

console.log('Sprint 3 fixes applied.');
