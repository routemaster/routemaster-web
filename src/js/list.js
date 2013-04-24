define("list", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore");

    // Need to pass el, model, shortTemplate, expandedTemplate
    var ListElementView = Backbone.View.extend({
        expanded: false,
        events: {
            "click": "toggle"
        },

        initialize: function(options) {
            this.shortTemplate = options.shortTemplate;
            this.expandedTemplate = options.expandedTemplate;
            this.render();
        },

        toggle: function() {
            this.expanded = !this.expanded;
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
            this.itemView = options.itemView;
            this.$ol = $('<ol/>').addClass("listing");
        },

        render: function() {
            // Create subviews for the objects in the collection
            this.subViews = [];
            this.collection.each(function(model) {
                var $li = $('<li/>');
                this.$ol.append($li);
                this.subViews.push(new this.itemView({
                    el: $li,
                    model: model,
                    shortTemplate: this.shortTemplate,
                    expandedTemplate: this.expandedTemplate
                }));
            }, this);
            // Render them
            _.each(this.subViews, function(subView) {
                subView.render();
            });
            this.$el.html(this.$ol);
        }
    });

    return {
        ListView: ListView,
        ListElementView: ListElementView
    };
});
