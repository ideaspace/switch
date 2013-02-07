/**
 * [Switcher类 用于实例化一个 switch 对象, 包含了 fade 和 slide(多种) 效果。默认状态下为 fade 效果。高级浏览器使用 CSS3 实现动画效果，不支持 CSS3 动画的浏览器使用 jQ 实现动画。] ver 1.1.2
 * @param {[jQuery]} element [元素选择器]
 * @param {[Object]} options [参数配置]
 *
 * var sw = new Switcher('#switch',{
 *     wrapClass : 'switch-in'    // @param {[String]} 条目父元素类名
 *     onClass   : 'active'       // @param {[String]} 激活状态的条目类名
 *     control   : true           // @param {[Boolean]} 是否出现前后控制按钮
 *     effect    : 'fade'         // @param {[String]} 动画效果
 *     prev      : '&#8249;'      // @param {[String]} 左道航文本
 *     next      : '&#8250;'      // @param {[String]} 右道航文本
 *     interval  : 3000           // @param {[Number]} 自动播放间隙时间
 *     auto      : true           // @param {[Boolean]} 是否循环播放
 *     page      : true           // @param {[Boolean]} 是否出现分页
 *     idx       : 3              // @param {[Number]} 初始显示条目索引
 * })
 */
+ function ($) {
    "use strict";
    var Switcher = function (element,options) {
        this.elem = $(element);
        this.conf = $.extend({}, this.settings, typeof options == 'object' && options);
        this.initialize();

    }

    Switcher.prototype = {
        constructor : Switcher,
        initialize : function() {
            var $this   = this.elem,
                $items  = this.items = $this.children(),
                $counts = this.slides = $items.length;

            if ( $counts < 2 ) return;

            var support = this.support = this.detect(),
                conf    = this.conf,
                idx     = this.idx = conf.idx || 0,
                regExp  = this.regExp = /slide/.test(conf.effect),
                effects = {
                    fade : 'fade',
                    slide : 'slide',
                    slideUp : 'slide-up',
                    slideDown : 'slide-down'
                };

            $this.wrapInner('<div class="' + conf.wrapClass + '"/>')

            if ( support ) {
                $items
                .parent()
                .addClass(effects[conf.effect])
                .end()
                .eq(idx)
                .addClass(conf.onClass);
            } else {
                $items.parent().addClass('non-css3');
                if ( !regExp ) {
                    $items.css('opacity',0)
                    .eq(idx).addClass(conf.onClass).css('opacity',1);
                } else {
                    $items.hide()
                    .eq(idx).addClass(conf.onClass).show();
                }
            }

            conf.control && this.control();
            conf.page && this.page();

            if ( conf.auto ) {
                this.cycle();
                $this
                .on('mouseenter', $.proxy(this.pause,this))
                .on('mouseleave', $.proxy(this.cycle,this));
            }

        },
        cycle : function() {
            var that = this;
            this.timer = setTimeout(function(){
                that.next();
                that.cycle();
            }, this.conf.interval || 3000 )
        },
        pause : function() {
            clearTimeout( this.timer );
            this.timer = null;
        },
        next : function() {
            if ( this.playing ) return;
            this.anim( this.conf.effect, 'next' );
        },
        prev : function() {
            if ( this.playing ) return;
            this.anim( this.conf.effect, 'prev' );
        },
        to : function( pos ) {
            if ( this.playing ) return;
            this.anim( this.conf.effect, pos );
        },
        anim : function( effect, type ) {

            var that = this,
                conf = this.conf,
                $this = this.elem,
                $items = this.items,
                $active = $this.find('.' + conf.onClass),
                idx = $items.index($active);

            if ( this.typeOf( type ) === "[object String]" ) {
                var $node = $active[type](),
                    direct = type == 'next' ? 'from' : 'to',
                    fallback = type == 'next' ? 'first' : 'last';
                $node = $node.length ? $node : $items[fallback]();
            }
            if ( this.typeOf( type ) === "[object Number]" ) {
                if ( idx == type ) return;
                var $node = $items.eq(type);
            }

            this.playing = true;
            var on = $items.index($node);
            if ( this.support ) {
                if ( !this.regExp ) {
                    $active.removeClass(conf.onClass);
                    $node.addClass(conf.onClass);
                    $this.one(this.support.end,function() {
                        that.playing = false;
                    })
                } else {
                    if ( $node.hasClass(conf.onClass) ) return;
                    var t = idx > on ? 'prev' : 'next',
                        d = idx > on ? 'to' : 'from';

                    $node.addClass(t);
                    $node[0].offsetWidth;
                    $active.addClass(d);
                    $node.addClass(d);

                    $this.one(this.support.end, function() {
                        $node.removeClass([t, d].join(' ')).addClass(conf.onClass)
                        $active.removeClass([conf.onClass, d].join(' '))
                        that.playing = false;
                    })
                }
            } else {
                var from, to, on,
                    props = {fadeIn : {opacity : 1 }, fadeOut : {opacity : 0 }, active : {left : 0, top : 0 }, left : {left : '-100%'}, right : {left : '100%'}, top : { top : '-100%'}, bottom : { top : '100%'} }
                this.regExp &&
                $node.show().css( effect == 'slide' ? 'left' : 'top', effect == 'slideDown' ? '-100%' : '100%' );
                if ( !this.regExp ) {
                    from = props['fadeOut'];
                    to   = props['fadeIn'];
                } else {
                    to = props['active'];

                    if ( idx > on ) {
                        from = props[effect == 'slide' ? 'right' : effect == 'slideUp' ? 'top' : 'bottom'];
                        $node.show().css(effect == 'slide' ? props['left'] : effect == 'slideUp' ? props['bottom'] : props['top']);
                    } else {
                        from = props[effect == 'slide' ? 'left' : effect == 'slideUp' ? 'bottom' : 'top'];
                        $node.show().css(effect == 'slide' ? props['right'] : effect == 'slideUp' ? props['top'] : props['bottom']);
                    }
                }
                $active.stop().animate(from, 800).queue(function(next) {
                    $(this).removeClass(conf.onClass);
                    next();
                })
                $node.stop().animate(to, 800).queue(function(next){
                    that.playing = false;
                    $(this).addClass(conf.onClass);
                    next();
                })
            }

            idx = on;

            if ( this.conf.page ) {
                this.pagination
                .children()
                .removeClass('on')
                .eq(idx).addClass('on');
            }
        },
        control : function() {
            var that = this;
            this.elem
            .prepend([
                '<a href="#" data-navi="prev" class="btn btn-prev">'+ this.conf.prev +'</a>',
                '<a href="#" data-navi="next" class="btn btn-next">'+ this.conf.next +'</a>'
            ])
            .on('click','[data-navi]',function(e) {
                that[$(this).data('navi')]();
                e.preventDefault();
            })
        },
        page : function() {
            var $page = this.pagination = $('<div/>',{
                'class' : 'pagi-nav'
            }), $list = [], that = this;

            for ( var i = 1; i <= this.slides; i++ ) {
                $list.push($('<a href="#"/>').html(this.conf.trigger || i));
            }

            this.elem
            .append($page.append($list))
            .on('click','.pagi-nav > a',function(e){
                that.to($(this).index());
                e.preventDefault();
            });

            $page
            .children()
            .eq(this.idx)
            .addClass('on');
        },
        detect : function() {
            var support = (function(){
                var node = document.createElement('switch'), name,
                    Transition = {
                        'webkitTransition' : 'webkitTransitionEnd',
                        'MozTransition' : 'transitionend',
                        'OTransition' : 'oTransitionEnd otransitionend',
                        'transition' : 'transitionend'
                    };
                for ( name in Transition ) {
                    if ( node.style[name] != undefined ) {
                        return Transition[name];
                    }
                }
            })();
            return support && {
                end : support
            }
        },
        typeOf : function( val ) {
            return Object.prototype.toString.call(val);
        }
    }
    Switcher.prototype.settings = {
        wrapClass : 'switch-in',
        onClass : 'active',
        control : true,
        effect : 'fade',
        interval : 3500,
        next : "&#8250;",
        prev : "&#8249;",
        auto : true,
        page : true
    }
    // window.Switcher = Switcher;

    $.fn.switches = function ( options ) {
        return this.each( function() {
            // console.log(this)
            new Switcher(this, options);
        })
    }
    $.fn.switches.constructor = Switcher;
}(window.jQuery)


