# Headless Salesforce user support for REST API

# Usage

## Create a setting file
Create a settings.json file in your projects root.

```json
{
  "salesforce": {
    "url": "https://test.salesforce.com",
    "auth": {
      "user": "<headless_user>",
      "pass": "<password><security_token>"
    }
  }
}
```


## Connect on startup
Make a single connection to Salesforce at server startup. All sobjects will use this connection.

```javascript
Meteor.startup(function () {

  if (Salesforce) {

    Salesforce.connect(function (error, response) {
      if (error) {

        return throwError('startup', 'Cannot connect to Salesforce');
      }
    });
  }
});
```

## Initialize the sobject you want to use
```javascript
if ( Meteor.isServer) {
  var ObjectAssign = Npm.require('object-assign');


  Account = Salesforce.extend({
    // instance prototype
    constructor: function (attrs) {

      // assign all resulting sfdc properties to this object
      ObjectAssign(this, attrs);
    }
  });


  Account.someStaticFunction = function () {
    // extend your salesforce object
  };


  Account._sobject = 'account'; // the salesforce object name
}
```

## Use it
This package uses the jsforce npm package as its main dependency. Please see the jsforce sobject docs for list of available functions. (.find() is a jsforce function)

```javascript
Account.find({Name: {$like: '%Acme%'}}, ['Id', 'Name'], {limit: 5}, function (error, records) {
  if (error) {
    return callback(error);
  }

  return callback(null, records);
});
```
