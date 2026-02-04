# 📁 nodejs - Project Structure

*Generated on: 2/2/2026, 2:52:08 PM*

## 📋 Quick Overview

| Metric | Value |
|--------|-------|
| 📄 Total Files | 96 |
| 📁 Total Folders | 32 |
| 🌳 Max Depth | 4 levels |
| 🛠️ Tech Stack | TypeScript, Node.js, Docker |

## ⭐ Important Files

- 🟡 🚫 **.gitignore** - Git ignore rules
- 🟡 🐳 **docker-compose.yml** - Docker compose
- 🟡 🐳 **Dockerfile** - Docker container
- 🟡 🔒 **package-lock.json** - Dependency lock
- 🔴 📦 **package.json** - Package configuration
- 🟡 🔷 **tsconfig.json** - TypeScript config

## 📊 File Statistics

### By File Type

- 🔷 **.ts** (TypeScript files): 71 files (74.0%)
- 📄 **.** (Other files): 10 files (10.4%)
- ⚙️ **.json** (JSON files): 8 files (8.3%)
- 📄 **.txt** (Text files): 2 files (2.1%)
- 📄 **.key** (Other files): 2 files (2.1%)
- 🚫 **.gitignore** (Git ignore): 1 files (1.0%)
- ⚙️ **.yml** (YAML files): 1 files (1.0%)
- 🐳 **.dockerfile** (Docker files): 1 files (1.0%)

### By Category

- **TypeScript**: 71 files (74.0%)
- **Other**: 12 files (12.5%)
- **Config**: 9 files (9.4%)
- **DevOps**: 2 files (2.1%)
- **Docs**: 2 files (2.1%)

### 📁 Largest Directories

- **root**: 96 files
- **src**: 54 files
- **__MACOSX**: 35 files
- **__MACOSX\src**: 30 files
- **src\modules**: 14 files

## 🌳 Directory Structure

```
nodejs/
├── 📂 __MACOSX/
│   ├── 📄 ._install.txt
│   ├── ⚙️ ._package-lock.json
│   ├── ⚙️ ._package.json
│   ├── 📄 ._src
│   ├── ⚙️ ._tsconfig.json
│   └── 📁 src/
│   │   ├── 🔷 ._app.ts
│   │   ├── 📄 ._config
│   │   ├── 📄 ._controllers
│   │   ├── 📄 ._middlewares
│   │   ├── 📄 ._modules
│   │   ├── 📄 ._routes
│   │   ├── 🔷 ._server.ts
│   │   ├── 📄 ._services
│   │   ├── ⚙️ ._swagger.json
│   │   ├── 🔷 ._swagger.ts
│   │   ├── 📄 ._types
│   │   ├── 📄 ._utils
│   │   ├── ⚙️ config/
│   │   │   ├── 🔷 ._brevo.ts
│   │   │   └── 🔷 ._env.ts
│   │   ├── 📂 controllers/
│   │   │   └── 🔷 ._auth.controller.ts
│   │   ├── 📂 middlewares/
│   │   │   ├── 🔷 ._errorHandler.ts
│   │   │   ├── 🔷 ._requestId.ts
│   │   │   └── 🔷 ._requestLogger.ts
│   │   ├── 📂 routes/
│   │   │   ├── 🔷 ._index.ts
│   │   │   ├── 📄 ._v1
│   │   │   └── 📂 v1/
│   │   │   │   ├── 🔷 ._auth.routes.ts
│   │   │   │   └── 🔷 ._index.ts
│   │   ├── 📂 services/
│   │   │   ├── 🔷 ._email.service.ts
│   │   │   └── 🔷 ._otp.service.ts
│   │   ├── 📂 types/
│   │   │   ├── 🔷 ._auth.types.ts
│   │   │   ├── 🔷 ._brevo.types.ts
│   │   │   └── 🔷 ._sib-api-v3-sdk.d.ts
│   │   └── 🔧 utils/
│   │   │   ├── 🔷 ._log.ts
│   │   │   ├── 🔷 ._logger.ts
│   │   │   └── 🔷 ._otp.util.ts
├── 🟡 🚫 **.gitignore**
├── 🟡 🐳 **docker-compose.yml**
├── 🟡 🐳 **Dockerfile**
├── 📄 install.txt
├── 🟡 🔒 **package-lock.json**
├── 🔴 📦 **package.json**
├── 📁 src/
│   ├── 🔷 app.ts
│   ├── ⚙️ config/
│   │   ├── 🔷 brevo.ts
│   │   ├── 🔷 cloudinary.ts
│   │   └── 🔷 env.ts
│   ├── 📂 constants/
│   ├── 📂 controllers/
│   │   └── 🔷 auth.controller.ts
│   ├── 📂 database/
│   │   └── 🔷 mongo.ts
│   ├── 📂 keys/
│   │   ├── 📄 private.key
│   │   └── 📄 public.key
│   ├── 📂 middlewares/
│   │   ├── 🔷 auth.middleware.ts
│   │   ├── 🔷 errorHandler.ts
│   │   ├── 🔷 multer.ts
│   │   ├── 🔷 requestId.ts
│   │   ├── 🔷 requestLogger.ts
│   │   └── 🔷 zod.middleware.ts
│   ├── 📂 modules/
│   │   ├── 📂 address-lookup/
│   │   │   ├── 🔷 address-lookup.controller.ts
│   │   │   └── 🔷 address-lookup.model.ts
│   │   ├── 📂 admin-configuration/
│   │   │   ├── 🔷 config.controller.ts
│   │   │   └── 🔷 config.model.ts
│   │   ├── 📂 admin-users/
│   │   │   ├── 🔷 adminuser.controller.ts
│   │   │   └── 🔷 adminuser.model.ts
│   │   ├── 📂 client-user-profiles/
│   │   │   ├── 🔷 userprofile.controller.ts
│   │   │   └── 🔷 userprofile.model.ts
│   │   ├── 📂 client-users/
│   │   │   ├── 🔷 user.controller.ts
│   │   │   └── 🔷 user.model.ts
│   │   ├── 📂 role-permissions/
│   │   │   ├── 🔷 role.controller.ts
│   │   │   └── 🔷 role.model.ts
│   │   └── 📂 service-types/
│   │   │   ├── 🔷 service.controller.ts
│   │   │   └── 🔷 service.model.ts
│   ├── 📂 routes/
│   │   ├── 🔷 index.ts
│   │   └── 📂 v1/
│   │   │   ├── 🔷 address-lookup.routes.ts
│   │   │   ├── 🔷 adminauth.routes.ts
│   │   │   ├── 🔷 adminuser.routes.ts
│   │   │   ├── 🔷 auth.routes.ts
│   │   │   ├── 🔷 config.routes.ts
│   │   │   ├── 🔷 index.ts
│   │   │   ├── 🔷 role.routes.ts
│   │   │   ├── 🔷 service.routes.ts
│   │   │   ├── 🔷 user.routes.ts
│   │   │   └── 🔷 userprofile.routes.ts
│   ├── 📂 schemas/
│   │   └── 🔷 adminuser.ts
│   ├── 🔷 server.ts
│   ├── 📂 services/
│   │   ├── 🔷 email.service.ts
│   │   └── 🔷 otp.service.ts
│   ├── ⚙️ swagger.json
│   ├── 🔷 swagger.ts
│   ├── 🧪 tests/
│   ├── 📂 types/
│   │   ├── 🔷 auth.types.ts
│   │   ├── 🔷 brevo.types.ts
│   │   └── 🔷 sib-api-v3-sdk.d.ts
│   └── 🔧 utils/
│   │   ├── 🔷 generators.ts
│   │   ├── 🔷 jwt.ts
│   │   ├── 🔷 log.ts
│   │   ├── 🔷 logger.ts
│   │   ├── 🔷 otp.util.ts
│   │   └── 🔷 validators.ts
└── 🟡 🔷 **tsconfig.json**
```

## 📖 Legend

### File Types
- 🚫 DevOps: Git ignore
- ⚙️ Config: YAML files
- 🐳 DevOps: Docker files
- 📄 Docs: Text files
- ⚙️ Config: JSON files
- 🔷 TypeScript: TypeScript files
- 📄 Other: Other files

### Importance Levels
- 🔴 Critical: Essential project files
- 🟡 High: Important configuration files
- 🔵 Medium: Helpful but not essential files
