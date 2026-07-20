import fs from 'node:fs';
import yaml from 'js-yaml';

const loadConfig = async (configPathOrData: string | object) => {
  if (typeof configPathOrData !== 'string') {
    return configPathOrData;
  }
  const content = fs.readFileSync(configPathOrData, 'utf8');
  if (configPathOrData.endsWith('.yaml') || configPathOrData.endsWith('.yml')) {
    return yaml.load(content);
  }
  throw new Error(`Unsupported config format: ${configPathOrData}. Only .yaml/.yml files are supported.`);
};

export default loadConfig;
