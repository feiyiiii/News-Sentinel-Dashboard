function toWeComMarkdown(markdownReport, alerts) {
  const lines = markdownReport
    .split('\n')
    .filter(Boolean)
    .slice(0, 24)
    .map((line) => {
      if (line.startsWith('# ')) return `# ${line.slice(2)}`;
      if (line.startsWith('## ')) return `**${line.slice(3)}**`;
      if (line.startsWith('- ')) return `- ${line.slice(2)}`;
      if (line.startsWith('  ')) return line.trim();
      return line;
    });

  if (alerts.length > 0) {
    lines.unshift(`<font color="warning">触发告警 ${alerts.length} 条</font>`);
  } else {
    lines.unshift('<font color="info">本轮未触发阈值告警</font>');
  }

  return lines.join('\n').slice(0, 3800);
}

export async function sendWebhook(config, markdownReport, alerts) {
  if (!config.webhook.url) {
    return { delivered: false, reason: 'No webhook is configured.' };
  }

  let payload;
  if (config.webhook.format === 'wecom') {
    payload = {
      msgtype: 'markdown',
      markdown: {
        content: toWeComMarkdown(markdownReport, alerts),
      },
    };
  } else if (config.webhook.format === 'discord') {
    payload = { content: markdownReport.slice(0, 1800) };
  } else if (config.webhook.format === 'slack') {
    payload = { text: markdownReport.slice(0, 3000) };
  } else {
    payload = {
      text: alerts.length ? alerts.join(' | ') : 'News Sentinel Bot finished a run.',
      report: markdownReport,
    };
  }

  const response = await fetch(config.webhook.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Webhook failed with ${response.status}: ${body.slice(0, 200)}`);
  }

  return { delivered: true };
}
