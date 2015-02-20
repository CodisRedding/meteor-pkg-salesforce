Package.describe({
  name: 'fourq:salesforce',
  summary: 'Salesforce REST Access',
  version: '1.0.0'
});

Package.onUse(function (api) {
  api.versionsFrom('0.9.4');
  api.addFiles('salesforce.js', 'server');
  api.export('Salesforce');
});

Npm.depends({
  jsforce: '1.3.1',
  async: '0.9.0',
  'ampersand-class-extend': '1.0.1',
  lodash: '3.1.0'
});
