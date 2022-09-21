const parseFunction = html => {
  const lines = html.split('\n').map(line => line.trim()).filter(Boolean);
  const [_, name, paramsHTML] = lines[0].match(/<D>(.+?)<\/D>\((?:<V>)?(.*?)(?:<\/V>)?\)/);

  const parameters = {
    list: paramsHTML.split('</V>, <V>'),
    details: [],
  };
  const descriptions = lines.filter(line => !line.startsWith('<'));

  let returns;
  let last_param;

  lines.slice(1).filter(line => line.startsWith('<')).map(line => {
    const tag = line.match(/^<(.+?)>/m)?.[1];

    if (tag == "V") {
      const [_, name, type, description, default_value, extra] = line.match(
        /<V>(.+?)<\/V><G> \((.+?)\)<\/G><BL>\s*(.+?)\s*<\/BL>(?: <G>\(default (.+?)(?:\s+(.+?))?\)<\/G>)?/
      );

      last_param = {
        name,
        type,
        descriptions: ([description, extra]).filter(Boolean),
        default_value,
      }
      parameters.details.push(last_param);

      return;
    }

    if (tag == "BL") {
      const [_, text] = line.match(
        /<BL>\s*\-?(.+?)<\/BL>/
      );
      const description = text.trim();

      if (last_param) {
        last_param.descriptions.push(description);
        return;
      }

      descriptions.push(description);

      return;
    }

    if (tag == "R") {
      const [_, type, description] = line.match(
        /<R>Returns<\/R> <G>\((.+?)\)<\/G> <BL>\s*(.+?)\s*<\/BL>/
      );

      returns = {
        type,
        description,
      }

      return;
    }

    descriptions.push(line);
  });

  return {
    name,
    parameters,
    descriptions,
    returns,
  };
}

const parseLuaTree = html => {
  const parentMap = {};

  let prev;
  let prevLevel = 0;

  return html.trim().split('<br />').map(line => {
    const href = line.match(/href='(.+?)'/)?.[1];
    const text = line.replace(/<.+?>/g, '');
    const match = text.match(/^(\s*)(.+?)(?: \: (.+?))?$/);

    if (!match) {
      return;
    }

    const [_, indent, key, value] = match;
    const level = 1 + (indent ? (indent.length / 2) : 0);

    let parent = prev;

    while (prevLevel >= level && parent) {
      prevLevel --;
      parent = parentMap[parent.name];
    }

    const keys = parent ? [ ...parent.name.split('.'), key ] : [key];

    prev = {
      value,
      href,
      name: keys.join('.'),
    };
    prevLevel = level;
    parentMap[prev.name] = parent;

    return prev;
  }).filter(Boolean);
}

const parseHelp = html => {
  const sections = html.split(new RegExp("<O><font size='20'>.+?</font></O>"));
  const version = sections[0].replace(/<.+?>/g, '').trim();
  const tree = parseLuaTree(sections[1]);
  const events = sections[2].trim().split('\n\n').map(parseFunction);
  const functions = sections[3].trim().split('\n\n').map(parseFunction);

  return {
    version,
    tree,
    events,
    functions,
  }
}

module.exports = {
  parseHelp,
  parseLuaTree,
  parseFunction,
}
