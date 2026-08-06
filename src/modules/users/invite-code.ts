import crypto from 'crypto';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export const generateInviteCode = (): string => {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
  }
  return code; 
};

export const hashInviteCode = (code: string): string => {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
};