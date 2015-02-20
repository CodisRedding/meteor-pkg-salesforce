/* global Salesforce:true */
var Async = Npm.require('async');
var JSForce = Npm.require('jsforce');
var ClassExtend = Npm.require('ampersand-class-extend');
var _ = Npm.require('lodash');


var BaseModel = function () {};
Salesforce = BaseModel; // make global for meteor app
BaseModel.extend = ClassExtend;

var connection;

BaseModel.connect = function (callback) {

    var settings = Meteor.settings.salesforce;
    if (!settings) {
        throw new Meteor.Error(500, 'Please provide salesforce configuration in settings.json');
    }

    connection = new JSForce.Connection({loginUrl: settings.url});
    connection.login(settings.auth.user, settings.auth.pass, function (err, response) {

        if (err) {
            return callback(err);
        }

        BaseModel.api = connection;
        callback(null, connection);
    });
};


BaseModel.disconnect = function () {

    BaseModel.api = null;
};


BaseModel.resultFactory = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var next = args.shift();
    var err = args.shift();
    var result = args.shift();

    if (err) {
        args.unshift(result);
        args.unshift(err);
        return next.apply(undefined, args);
    }

    var self = this;

    if (Object.prototype.toString.call(result) === '[object Array]') {
        result.forEach(function (item, index) {

            result[index] = new self(item);
        });
    }

    if (Object.prototype.toString.call(result) === '[object Object]') {
        result = new this(result);
    }

    args.unshift(result);
    args.unshift(err);
    next.apply(undefined, args);
};


BaseModel.pagedFind = function (query, fields, sort, limit, page, callback) {

    var self = this;
    var output = {
        data: undefined,
        pages: {
            current: page,
            prev: 0,
            hasPrev: false,
            next: 0,
            hasNext: false,
            total: 0
        },
        items: {
            limit: limit,
            begin: ((page * limit) - limit) + 1,
            end: page * limit,
            total: 0
        }
    };

    fields = this.fieldsAdapter(fields);
    sort = this.sortAdapter(sort);

    Async.auto({
        count: function (done) {

            self.count(query, done);
        },
        find: function (done) {

            var options = {
                limit: limit,
                skip: (page - 1) * limit,
                sort: sort
            };

            self.find(query, fields, options, done);
        }
    }, function (err, results) {

        if (err) {
            return callback(err);
        }

        output.data = results.find;
        output.items.total = results.count;

        // paging calculations
        output.pages.total = Math.ceil(output.items.total / limit);
        output.pages.next = output.pages.current + 1;
        output.pages.hasNext = output.pages.next <= output.pages.total;
        output.pages.prev = output.pages.current - 1;
        output.pages.hasPrev = output.pages.prev !== 0;
        if (output.items.begin > output.items.total) {
            output.items.begin = output.items.total;
        }
        if (output.items.end > output.items.total) {
            output.items.end = output.items.total;
        }

        callback(null, output);
    });
};


BaseModel.fieldsAdapter = function (fields) {

    if (Object.prototype.toString.call(fields) === '[object String]') {
        var document = {};

        fields = fields.split(/\s+/);
        fields.forEach(function (field) {

            if (field) {
                document[field] = true;
            }
        });

        fields = document;
    }

    return fields;
};


BaseModel.sortAdapter = function (sorts) {

    if (Object.prototype.toString.call(sorts) === '[object String]') {
        var document = {};

        sorts = sorts.split(/\s+/);
        sorts.forEach(function (sort) {

            if (sort) {
                var order = sort[0] === '-' ? -1 : 1;
                if (order === -1) {
                    sort = sort.slice(1);
                }
                document[sort] = order;
            }
        });

        sorts = document;
    }

    return sorts;
};


BaseModel.insert = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var sobject = BaseModel.api.sobject(this._sobject);

    sobject.insert.apply(sobject, args);
};


BaseModel.find = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var sobject = BaseModel.api.sobject(this._sobject);
    var callback = this.resultFactory.bind(this, args.pop());

    args.push(callback);
    // console.log('find:', args);
    sobject.find.apply(sobject, args);
};


BaseModel.findOne = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var sobject = BaseModel.api.sobject(this._sobject);
    var callback = this.resultFactory.bind(this, args.pop());

    args.push(callback);
    sobject.findOne.apply(sobject, args);
};


BaseModel.findByIdAndUpdate = function() {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var id = args.shift();
    var update = args.shift();
    var callback = this.resultFactory.bind(this, args.pop());

    var self = this;
    this.findById(id, function (err, result) {

        if (err) {
            callback(err);
        }

        _.keys(update).forEach(function (key) {
            result[key] = update[key];
        });

        self.update(result, callback);
    });
};


BaseModel.findById = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var sobject = BaseModel.api.sobject(this._sobject);
    var id = args.shift();
    var query = { Id: id === undefined ? '' : id };
    var callback = this.resultFactory.bind(this, args.pop());

    args.unshift(query);
    args.push(callback);

    sobject.findOne.apply(sobject, args);
};


BaseModel.update = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var sobject = BaseModel.api.sobject(this._sobject);

    sobject.update.apply(sobject, args);
};


BaseModel.count = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var sobject = BaseModel.api.sobject(this._sobject);

    sobject.count.apply(sobject, args);
};


BaseModel.remove = function () {

    var args = new Array(arguments.length);
    for (var i = 0 ; i < args.length ; ++i) {
        args[i] = arguments[i];
    }

    var sobject = BaseModel.api.sobject(this._sobject);

    sobject.del.apply(sobject, args);
};
