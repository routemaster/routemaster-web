define("list", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore");

    // Need to pass el, model, shortTemplate, expandedTemplate
    var ListElementView = Backbone.View.extend({
        expanded: false,

        initialize: function(options) {
            this.shortTemplate = options.shortTemplate;
            this.expandedTemplate = options.expandedTemplate;
        },

        expand: function() {
            this.expanded = true;
            this.render();
        },

        collapse: function() {
            this.expanded = false;
            this.render();
        },

        render: function() {
            this.$el.html(this.shortTemplate(this.model.attributes));
            if(this.expanded) {
                this.$el.append(this.expandedTemplate(this.model.attributes));
            }
        }
    });

    // Generic view for showing lists of items
    // You need to pass el, collection, shortTemplate, expandedTemplate
    var ListView = Backbone.View.extend({
        subViews: [],

        close: function() {
            this.remove();
            this.unbind();
        },

        initialize: function(options) {
            this.shortTemplate = options.shortTemplate;
            this.expandedTemplate = options.expandedTemplate;
            this.$ol = $('<ol/>').addClass("listing");
            this.collection.each(function(model) {
                var $li = $('<li/>');
                this.$ol.append($li);
                this.subViews.push(new ListElementView({
                    el: $li,
                    model: model,
                    shortTemplate: this.shortTemplate,
                    expandedTemplate: this.expandedTemplate
                }));
            }, this);
            // Watch the collection for changes
            //this.collection.on("add", function(item) {
            //    // New item!!!
            //}, this);
            //this.collection.on("remove", function(item) {
            //    // Removed item!!!
            //}, this);
        },

        render: function() {
            _.each(this.subViews, function(subView) {
                subView.render();
            });
            this.$el.html(this.$ol);
        }
    });

    return { ListView: ListView };
});