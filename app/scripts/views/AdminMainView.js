var $ = require('jquery'),
    Backbone = require('backbone'),
    AdminEditArticleView = require('./AdminEditArticleView');

var AdminMainView = Backbone.View.extend({
    initialize: function() {
        this.listenTo(this.collection, 'add', this.renderContact);
        this.listenTo(this.collection, 'change', this.render);
        this.render();
    },
    render: function(){
        $('.east_side').empty();
        $('.east_side').append('<table id="articles_table"></table>')
        this.collection.forEach(function(article){
            this.renderArticle(article);
        }, this);
        $('<div class="sidebar"><button type="button" id="add_new_article">Додати нову статтю</button></div>').prependTo('.east_side');
        $('#add_new_article').on('click', function(){
            App.eventAggregator.trigger('add:article');
        });
        return this;
    },
    renderArticle: function(article) {
        var adminEditArticleView = new AdminEditArticleView({
            model: article
        });
        $('#articles_table').append(adminEditArticleView.render().el);
    }
});
module.exports = AdminMainView;