import { EXTENSION_RULE_TYPE_MAP } from "@/constants/rules/rules";
import type { HeaderType, Rule } from "@/types/rules";
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { xml } from '@codemirror/lang-xml';

export const mimeToExtension: Record<string, any> = {
  'text/css': css(),
  'text/javascript': javascript(),
  'application/json': json(),
  'application/xml': xml(),
  'text/html': html(),
  'text/plain': [] // fallback to plain text
};


export const getDataUrl = (content: string, mimeType: string, filename: string) => {
  const encodedContent = encodeURIComponent(content);

  let dataUrl = `data:${mimeType};charset=utf-8,${encodedContent}`;
  if (filename) {
    dataUrl = `data:${mimeType};charset=utf-8;name=${encodeURIComponent(filename)},${encodedContent}`;
  }
  return dataUrl;
};

export const transformRulesToExtensionFormat = (rules: Rule[]) => {
  const transformedRules = rules.reduce((allRules: any[], rule) => {
    let actions = [];
    switch (rule.type) {
      case 'block':
        actions = [{}];
        break;
      case 'redirect':
        actions = [{
          redirect: {
            url: rule.config?.destination_url
          }
        }];
        break;
      case 'modify-response':
        actions = [{
          redirect: {
            url: getDataUrl(rule.config.response, rule.config.response_type, rule.url_pattern)
          }
        }];
        break;
      case 'modify-headers':
        actions = [{
          requestHeaders: (rule.config?.request || []).map((item: HeaderType)=>({
            header: item.key,
            operation: item.action,
            value: item.action !== 'remove' ? item.value : undefined 
          })),
        },
        {
          responseHeaders: (rule.config?.response || []).map((item: HeaderType)=>({
            header: item.key,
            operation: item.action,
            value: item.action !== 'remove' ? item.value : undefined
          }))
        }];
        break;
      default:
        return allRules;
    }

    const updatedRules = actions.map((action, index) => ({
      id: rule.id as number * 10 + index, // Generate DeclarativeNetRequest ID
      priority: 1 + index,
      action: {
        type: EXTENSION_RULE_TYPE_MAP[rule.type],
        ...action,
      },
      condition: {
        urlFilter: rule.url_pattern,
        ...(rule.advanced_filters?.initiator_domain || []).length && {
          initiatorDomains: rule.advanced_filters?.initiator_domain || []
        },
        resourceTypes: rule.advanced_filters?.resource_types || [],
        requestMethods: !('responseHeaders' in action) ? rule.advanced_filters?.methods || [] : undefined
      }
    }));

    allRules.push(...updatedRules);

    return allRules;
  }, []);

  return transformedRules;
}