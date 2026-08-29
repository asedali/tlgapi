import { parseMessage } from "./parser.js";

const text = `
💰 نقد فردا

◀️ هر مثقال :
🟢 فروش : ۸۳,۰۵۰,۰۰۰
🔴 خرید : ۸۲,۸۵۰,۰۰۰

◀️ هرگرم :
🟢 فروش : ۱۹,۱۷۲,۱۶۹
🔴 خرید : ۱۹,۱۲۵,۹۹۸
`;

console.log(parseMessage(text));