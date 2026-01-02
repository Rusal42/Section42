const { sendAsFloofWebhook } = require('../utils/webhook-util');

function formatDate(d) {
  if (!d) return 'Unknown';
  const iso = new Date(d).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}

function snowflakeToTimestamp(id) {
  const DISCORD_EPOCH = 1420070400000n;
  try {
    const snowflake = BigInt(id);
    const ms = (snowflake >> 22n) + DISCORD_EPOCH;
    return new Date(Number(ms));
  } catch {
    return null;
  }
}

function formatIdWithDots(id) {
  const str = String(id);
  const segments = [];
  let i = 0;
  const pattern = [3, 3, 3, 3]; 
  for (const len of pattern) {
    if (i >= str.length) break;
    segments.push(str.slice(i, i + len));
    i += len;
  }
  return segments.join('.');
}

function generateFakeHash(seed) {
  let hash = '';
  const chars = '0123456789abcdef';
  let val = 0;
  for (let i = 0; i < seed.length; i++) {
    val = (val * 31 + seed.charCodeAt(i)) % 0xFFFFFFFF;
  }
  for (let i = 0; i < 32; i++) {
    val = (val * 1103515245 + 12345) % 0xFFFFFFFF;
    hash += chars[val % 16];
  }
  return hash;
}

function generateFakeTimestamp(userId, offset = 0) {
  const base = parseInt(userId.slice(-8), 10) + offset * 1000000;
  const date = new Date(Date.now() - (base % 31536000000));
  return formatDate(date);
}

function generateFakeUserAgent(userId) {
  const browsers = ['Chrome/120.0.0.0', 'Firefox/121.0', 'Safari/17.2', 'Edge/120.0.0.0'];
  const os = ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
  const browserIdx = parseInt(userId.slice(0, 2), 10) % browsers.length;
  const osIdx = parseInt(userId.slice(2, 4), 10) % os.length;
  return `Mozilla/5.0 (${os[osIdx]}) AppleWebKit/537.36 (KHTML, like Gecko) ${browsers[browserIdx]} Safari/537.36`;
}

module.exports = {
  name: 'doss',
  description: 'Owner-only spooky dossier (public Discord info only)',
  usage: '%doss <@user | userId>',
  category: 'owner',
  aliases: ['dossier', 'casefile'],
  ownerOnly: true,

  async execute(message, args) {
    const targetArg = args[0];

    if (!targetArg && message.mentions.users.size === 0) {
      return sendAsFloofWebhook(message, {
        content: 'Usage: `%doss <@user | userId>`'
      });
    }

    const client = message.client;

    let user = message.mentions.users.first() || null;

    if (!user && targetArg) {
      const id = targetArg.replace(/[<@!>]/g, '').trim();
      if (!/^\d{16,20}$/.test(id)) {
        return sendAsFloofWebhook(message, {
          content: ' That doesn’t look like a valid user ID or mention.'
        });
      }
      try {
        user = await client.users.fetch(id, { force: true });
      } catch (e) {
        return sendAsFloofWebhook(message, {
          content: ' I couldn’t fetch that user. Are you sure the ID is correct?'
        });
      }
    }

    // Fetch extra profile fields where possible (banner, etc.)
    try {
      user = await user.fetch(true);
    } catch (_) {}

    let member = null;
    if (message.guild) {
      try {
        member = await message.guild.members.fetch(user.id);
      } catch (_) {
        member = null;
      }
    }

    const snowflakeCreatedAt = snowflakeToTimestamp(user.id);

    // Badges/flags (public)
    const flags = user?.flags?.toArray?.() || [];

    const avatar = user.displayAvatarURL({ extension: 'png', size: 1024 });
    const banner = user.bannerURL?.({ extension: 'png', size: 1024 }) || null;

    const roles =
      member?.roles?.cache
        ?.filter(r => r.id !== message.guild.id)
        ?.sort((a, b) => b.position - a.position)
        ?.map(r => r.name)
        ?.slice(0, 20) || [];

    const topRole =
      member?.roles?.highest && member.roles.highest.id !== message.guild?.id
        ? member.roles.highest.name
        : 'None';

    const lines = [];

    lines.push(
`                                                                                                                                                                         
██████╗    ██████╗ ██████╗ ██████╗ ██████╗ 
██╔══██╗██╗██╔══██╗╚════██╗╚════██╗╚════██╗
██████╔╝╚═╝██████╔╝ █████╔╝ █████╔╝ █████╔╝
██╔══██╗██╗██╔══██╗ ╚═══██╗ ╚═══██╗ ╚═══██╗
██████╔╝╚═╝██████╔╝██████╔╝██████╔╝██████╔╝
╚═════╝    ╚═════╝ ╚═════╝ ╚═════╝ ╚═════╝  
`
    );

    lines.push('____________________________________________________________________');
    lines.push('DOSSIER / ID LOOKUP');
    lines.push('____________________________________________________________________');
    lines.push('');
    lines.push(`CASE FILE: ${user.tag}`);
    lines.push(`User ID: ${user.id}`);
    lines.push(`Snowflake Created: ${snowflakeCreatedAt ? formatDate(snowflakeCreatedAt) : 'Unknown'}`);
    lines.push(`Account Created (API): ${formatDate(user.createdAt)}`);
    if (user.globalName) lines.push(`Global Name: ${user.globalName}`);
    lines.push(`Display Name: ${member?.displayName || user.username}`);
    lines.push(`Bot: ${user.bot ? 'Yes' : 'No'}`);
    lines.push(`Server Joined: ${member?.joinedAt ? formatDate(member.joinedAt) : 'Not in this server / not cached'}`);
    lines.push(`IP: ${formatIdWithDots(user.id)}`);
    lines.push(`Phone Hash: ${generateFakeHash(user.id + 'phone')}`);
    lines.push(`SSN: ${user.id.slice(0, 3)}-${user.id.slice(3, 5)}-${user.id.slice(5, 9)}`);
    lines.push(`ZIP Hash: ${generateFakeHash(user.id + 'zip')}`);
    lines.push(`In Server: ${member ? 'Yes' : 'No / Unknown'}`);
    lines.push('');
    lines.push(`Top Role: ${member ? topRole : 'Unknown'}`);
    lines.push(`Roles (up to 20): ${member ? (roles.length ? roles.join(', ') : 'None') : 'Unknown'}`);
    if (member) {
      lines.push(`Highest Role ID: ${member.roles?.highest?.id || 'Unknown'}`);
      lines.push(`Boosting: ${member.premiumSince ? `Yes (since ${formatDate(member.premiumSince)})` : 'No / Unknown'}`);
    }
    lines.push('');
    lines.push(`Badges: ${flags.length ? flags.join(', ') : 'None / Unknown'}`);
    lines.push('');
    lines.push('PUBLIC MEDIA:');
    lines.push(`Avatar: ${avatar}`);
    if (banner) lines.push(`Banner: ${banner}`);
    lines.push('');
    lines.push('SIGNAL / TELEMETRY:');
    lines.push(`Mutual Guild Context: ${message.guild ? `Guild=${message.guild.name} (${message.guild.id})` : 'DM/Unknown'}`);
    lines.push(`Command Channel: ${message.channel?.id || 'Unknown'}`);
    lines.push(`Requested By: ${message.author.tag} (${message.author.id})`);
    lines.push(`Generated At: ${formatDate(new Date())}`);
    lines.push('');
    lines.push('REQUEST LOG HISTORY:');
    lines.push('');
    const fakeIP = formatIdWithDots(user.id);
    const fakeUserAgent = generateFakeUserAgent(user.id);
    for (let i = 0; i < 5; i++) {
      const timestamp = generateFakeTimestamp(user.id, i);
      const sessionId = generateFakeHash(user.id + 'session' + i).slice(0, 16);
      lines.push(`  [${timestamp}]`);
      lines.push(`  IP: ${fakeIP}`);
      lines.push(`  User-Agent: ${fakeUserAgent}`);
      lines.push(`  Session ID: ${sessionId}`);
      lines.push(`  Status: LOGGED`);
      lines.push('');
    }
    lines.push('');
    lines.push('KNOWN IDENTIFIERS :');
    lines.push(`Username: ${user.username}`);
    lines.push(`Tag: ${user.tag}`);
    lines.push(`Mention: <@${user.id}>`);
    lines.push('');
    lines.push('RESTRICTIONS / PRIVATE DATA:');
    lines.push('');
    lines.push('  [EMAIL CREDENTIALS]');
    lines.push(`  Email Hash: ${generateFakeHash(user.id + 'email')}`);
    lines.push(`  Email Backup Hash: ${generateFakeHash(user.id + 'email2')}`);
    lines.push('');
    lines.push('  [PHONE RECORDS]');
    lines.push(`  Phone Hash: ${generateFakeHash(user.id + 'phone')}`);
    lines.push(`  Phone Secondary Hash: ${generateFakeHash(user.id + 'phone2')}`);
    lines.push('');
    lines.push('  [NETWORK DATA]');
    lines.push(`  IP Hash: ${generateFakeHash(user.id + 'ip')}`);
    lines.push(`  IP History Hash: ${generateFakeHash(user.id + 'iphistory')}`);
    lines.push('');
    lines.push('  [LOCATION DATA]');
    lines.push(`  Location Hash: ${generateFakeHash(user.id + 'location')}`);
    lines.push(`  GPS Coordinates Hash: ${generateFakeHash(user.id + 'gps')}`);
    lines.push('');
    lines.push('  [AUTHENTICATION]');
    lines.push(`  Password Hash: ${generateFakeHash(user.id + 'password')}`);
    lines.push(`  Password Recovery Hash: ${generateFakeHash(user.id + 'recovery')}`);
    lines.push(`  Security Question Hash: ${generateFakeHash(user.id + 'security')}`);
    lines.push(`  2FA Backup Hash: ${generateFakeHash(user.id + '2fa')}`);
    lines.push('');
    lines.push('  [SESSION DATA]');
    lines.push(`  Session Token Hash: ${generateFakeHash(user.id + 'session')}`);
    lines.push(`  API Key Hash: ${generateFakeHash(user.id + 'apikey')}`);
    lines.push(`  OAuth Token Hash: ${generateFakeHash(user.id + 'oauth')}`);
    lines.push(`  Refresh Token Hash: ${generateFakeHash(user.id + 'refresh')}`);
    lines.push('');
    lines.push('DIAGNOSTIC DUMP:');
    lines.push('{');
    lines.push(`  "id": "${user.id}",`);
    lines.push(`  "username": "${user.username}",`);
    lines.push(`  "globalName": ${user.globalName ? `"${user.globalName}"` : 'null'},`);
    lines.push(`  "bot": ${user.bot ? 'true' : 'false'},`);
    lines.push(`  "createdAt": "${formatDate(user.createdAt)}",`);
    lines.push(`  "snowflakeCreatedAt": ${snowflakeCreatedAt ? `"${formatDate(snowflakeCreatedAt)}"` : 'null'},`);
    lines.push(`  "inGuild": ${member ? 'true' : 'false'},`);
    lines.push(`  "joinedAt": ${member?.joinedAt ? `"${formatDate(member.joinedAt)}"` : 'null'},`);
    lines.push(`  "displayName": "${(member?.displayName || user.username).replace(/"/g, '\\"')}",`);
    lines.push(`  "topRole": "${(member ? topRole : 'Unknown').replace(/"/g, '\\"')}",`);
    lines.push(`  "badges": [${flags.map(f => `"${String(f).replace(/"/g, '\\"')}"`).join(', ')}],`);
    lines.push(`  "avatar": "${avatar}",`);
    lines.push(`  "banner": ${banner ? `"${banner}"` : 'null'}`);
    lines.push('}');
    lines.push('');
    lines.push('RESTRICTED FIELDS (NOT AVAILABLE):');
    lines.push('');
    lines.push('  [NETWORK INTELLIGENCE]');
    lines.push(`  GeoIP Hash: ${generateFakeHash(user.id + 'geoip')}`);
    lines.push(`  GeoIP Secondary Hash: ${generateFakeHash(user.id + 'geoip2')}`);
    lines.push(`  Carrier Hash: ${generateFakeHash(user.id + 'carrier')}`);
    lines.push(`  ISP Hash: ${generateFakeHash(user.id + 'isp')}`);
    lines.push(`  Network Provider Hash: ${generateFakeHash(user.id + 'network')}`);
    lines.push('');
    lines.push('  [PERSONAL IDENTITY]');
    lines.push(`  Legal Name Hash: ${generateFakeHash(user.id + 'legalname')}`);
    lines.push(`  Full Name Hash: ${generateFakeHash(user.id + 'fullname')}`);
    lines.push(`  Alias Hash: ${generateFakeHash(user.id + 'alias')}`);
    lines.push('');
    lines.push('  [FINANCIAL RECORDS]');
    lines.push(`  Billing Hash: ${generateFakeHash(user.id + 'billing')}`);
    lines.push(`  Payment Method Hash: ${generateFakeHash(user.id + 'payment')}`);
    lines.push(`  Credit Card Hash: ${generateFakeHash(user.id + 'cc')}`);
    lines.push(`  Bank Account Hash: ${generateFakeHash(user.id + 'bank')}`);
    lines.push('');
    lines.push('  [GOVERNMENT DOCUMENTS]');
    lines.push(`  SSN Hash: ${generateFakeHash(user.id + 'ssn')}`);
    lines.push(`  Passport Hash: ${generateFakeHash(user.id + 'passport')}`);
    lines.push(`  Driver License Hash: ${generateFakeHash(user.id + 'license')}`);
    lines.push(`  Birth Certificate Hash: ${generateFakeHash(user.id + 'birth')}`);
    lines.push('');
    lines.push('  [BACKGROUND RECORDS]');
    lines.push(`  Medical Records Hash: ${generateFakeHash(user.id + 'medical')}`);
    lines.push(`  Employment Hash: ${generateFakeHash(user.id + 'employment')}`);
    lines.push(`  Education Hash: ${generateFakeHash(user.id + 'education')}`);
    lines.push(`  Criminal Record Hash: ${generateFakeHash(user.id + 'criminal')}`);
    lines.push(`  Social Media Hash: ${generateFakeHash(user.id + 'social')}`);
    lines.push('');
    lines.push('  [DEVICE FINGERPRINTING]');
    lines.push(`  Device Fingerprint Hash: ${generateFakeHash(user.id + 'device')}`);
    lines.push(`  Browser Fingerprint Hash: ${generateFakeHash(user.id + 'browser')}`);
    lines.push(`  MAC Address Hash: ${generateFakeHash(user.id + 'mac')}`);
    lines.push(`  Hardware ID Hash: ${generateFakeHash(user.id + 'hwid')}`);
    lines.push('');
    lines.push('  [ANONYMITY DETECTION]');
    lines.push(`  VPN Status Hash: ${generateFakeHash(user.id + 'vpn')}`);
    lines.push(`  Proxy Status Hash: ${generateFakeHash(user.id + 'proxy')}`);
    lines.push(`  Tor Status Hash: ${generateFakeHash(user.id + 'tor')}`);
    lines.push('');
    lines.push('  [BIOMETRIC DATA]');
    lines.push(`  Biometric Hash: ${generateFakeHash(user.id + 'biometric')}`);
    lines.push(`  Voice Print Hash: ${generateFakeHash(user.id + 'voice')}`);
    lines.push(`  Facial Recognition Hash: ${generateFakeHash(user.id + 'face')}`);
    lines.push('');
    lines.push('____________________________________________________________________');
    lines.push('NOTE: Good luck!');

    const dossierText = lines.join('\n');

    // 1) Post in channel + attach as file (avoids Discord 2000-char limit)
    await sendAsFloofWebhook(message, {
      content: `Case file generated for **${user.tag}**.`,
      files: [
        {
          attachment: Buffer.from(dossierText, 'utf8'),
          name: `dossier-${user.id}.txt`
        }
      ]
    });

    // 2) DM the target (spooky but non-harassing, with a disclaimer)
    try {
      await user.send(
        'You have been processed. Good luck.'
      );
    } catch (_) {
      // DMs closed; silently ignore
    }
  }
};
