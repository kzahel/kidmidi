import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

// Cross-file checks complement Stylelint: CSS Modules alone neither reject
// unknown exports nor detect unused ones. Dynamic style indexing is prohibited.
const write = process.argv.includes('--write');
async function sourceFiles(directory = 'src', prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? sourceFiles(`${directory}/${entry.name}`, `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`],
    ),
  );
  return groups.flat();
}
const files = await sourceFiles();
const modules = new Map();
const errors = [];
for (const file of files)
  if (file.endsWith('.css') && !file.endsWith('.module.css'))
    errors.push(`${file}: stylesheets must be CSS Modules`);
for (const file of files.filter((file) => file.endsWith('.module.css'))) {
  const source = await readFile(`src/${file}`, 'utf8');
  const ast = postcss.parse(source, { from: file });
  const classes = new Set();
  ast.walkRules((rule) => {
    if (rule.parent.type === 'atrule' && rule.parent.name.endsWith('keyframes'))
      return;
    selectorParser((selectors) => {
      selectors.each((selector) => {
        let scoped = false;
        selector.walkPseudos((pseudo) => {
          if (pseudo.value === ':global')
            errors.push(`${file}: global selectors are not allowed`);
        });
        selector.walkClasses((node) => {
          classes.add(node.value);
          let parent = node.parent;
          let negative = false;
          while (parent && parent !== selector) {
            if (
              parent.type === 'pseudo' &&
              [':not', ':has'].includes(parent.value)
            )
              negative = true;
            parent = parent.parent;
          }
          if (!negative) scoped = true;
        });
        if (!scoped) errors.push(`${file}: unscoped selector ${selector}`);
      });
    }).processSync(rule.selector);
  });
  const animations = ast.nodes.filter(
    (node) => node.type === 'atrule' && node.name === 'keyframes',
  );
  const animationValues = [];
  ast.walkDecls(/^animation/, (decl) => animationValues.push(decl.value));
  for (const frame of animations)
    if (
      !animationValues.some((value) =>
        value.split(/[\s,]+/).includes(frame.params),
      )
    )
      errors.push(`${file}: unused keyframes ${frame.params}`);
  modules.set(file, { classes, used: new Set() });
}
for (const file of files.filter((file) => /\.[jt]sx?$/.test(file))) {
  const source = await readFile(`src/${file}`, 'utf8');
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  const imports = new Map();
  for (const statement of ast.program.body)
    if (
      statement.type === 'ImportDeclaration' &&
      statement.source.value.endsWith('.module.css')
    ) {
      const filename = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), statement.source.value),
      );
      if (!modules.has(filename))
        errors.push(`${file}: missing stylesheet ${filename}`);
      const binding = statement.specifiers.find(
        (specifier) => specifier.type === 'ImportDefaultSpecifier',
      );
      if (binding) imports.set(binding.local.name, filename);
    }
  function visit(node, parent = null) {
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'MemberExpression' &&
      node.object.type === 'Identifier' &&
      imports.has(node.object.name)
    ) {
      const filename = imports.get(node.object.name);
      const exported =
        !node.computed && node.property.type === 'Identifier'
          ? node.property.name
          : node.property.type === 'StringLiteral'
            ? node.property.value
            : null;
      if (exported === null)
        errors.push(`${file}: styles must use static class names`);
      else if (!modules.get(filename)?.classes.has(exported))
        errors.push(`${file}: ${filename} has no class ${exported}`);
      else modules.get(filename).used.add(exported);
    }
    if (
      node.type === 'Identifier' &&
      imports.has(node.name) &&
      parent?.type !== 'ImportDefaultSpecifier' &&
      !(parent?.type === 'MemberExpression' && parent.object === node)
    ) {
      errors.push(
        `${file}: style modules cannot be aliased or passed dynamically`,
      );
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach((child) => visit(child, node));
      else if (value && typeof value === 'object' && 'type' in value)
        visit(value, node);
    }
  }
  visit(ast);
}
for (const [file, { classes, used }] of modules) {
  for (const name of classes)
    if (!used.has(name)) errors.push(`${file}: unused class ${name}`);
  const declaration = `// Generated by npm run styles:write. Do not edit.\ndeclare const styles: {\n${[
    ...classes,
  ]
    .sort()
    .map((name) => `  readonly '${name}': string;`)
    .join('\n')}\n};\nexport default styles;\n`;
  const target = `src/${file}.d.ts`;
  if (write) await writeFile(target, declaration);
  else if ((await readFile(target, 'utf8').catch(() => '')) !== declaration)
    errors.push(`${target}: run npm run styles:write`);
}
if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else
  process.stdout.write(
    `Checked ${modules.size} scoped stylesheets, class usage and exact typings.\n`,
  );
