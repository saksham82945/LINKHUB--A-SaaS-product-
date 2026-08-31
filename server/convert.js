const fs = require('fs');

let schema = fs.readFileSync('e:/Desktop/LINKHUB/server/prisma/schema.prisma', 'utf-8');

// Change provider
schema = schema.replace(/provider = "postgresql"/, 'provider = "sqlite"');
schema = schema.replace(/url\s+=\s+env\("DATABASE_URL"\)/, 'url      = "file:./dev.db"');

// The enums
const enums = [
  'Role', 'Plan', 'IntegrationService', 'LinkType', 'TargetDevice', 
  'GateType', 'DeviceType', 'ResumeTemplate', 'CoverLetterTemplate', 
  'CoverLetterTone', 'PortfolioDocType', 'DocumentType', 'TeamRole', 
  'PaymentStatus', 'BillingCycle'
];

// Remove enum definitions
schema = schema.replace(/enum \w+ {[\s\S]*?}/g, '');

// Replace enum field types with String and add quotes to defaults
enums.forEach(e => {
  const regex = new RegExp(`(\\w+)\\s+${e}(\\?)?\\s+(@default\\(([^)]+)\\))?`, 'g');
  schema = schema.replace(regex, (match, fieldName, optional, defaultBlock, defaultVal) => {
    let replacement = `${fieldName} String${optional || ''}`;
    if (defaultBlock) {
      replacement += ` @default("${defaultVal}")`;
    }
    return replacement;
  });
});

// SQLite doesn't support Json type in Prisma, change to String
schema = schema.replace(/Json\?/g, 'String?');
schema = schema.replace(/Json/g, 'String');

// SQLite doesn't support Decimal type, change to Float
schema = schema.replace(/Decimal\?/g, 'Float?');
schema = schema.replace(/Decimal/g, 'Float');

fs.writeFileSync('e:/Desktop/LINKHUB/server/prisma/schema.prisma', schema);
console.log('Converted schema to SQLite');
