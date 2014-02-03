(function() {
	"use strict";

	jQuery('document').ready(function() {
		var initialized = false, active = false, designer = null, editor, style, editing = "", previousTarget, traversedParents = 0;
		
		$(window).on('action:connected', function() {
			if (app.isAdmin && !initialized) {
				initialized = true;

				$('body').on('contextmenu', function(ev) {
					if (active) {
						var parents = $(ev.target).parents(),
							nodelist = [];

						for (var p in parents) {
							if (parents.hasOwnProperty(p)) {
								var id, className, type;

								if (id = parents[p].id) {
									nodelist.push("#" + id);
								} else if (className = parents[p].className) {
									nodelist.push("." + className.replace(/ /g,  '.'));
								} else if (parents[p].nodeName) {
									nodelist.push(parents[p].nodeName);
								}
							}
						}

						// curious how parents() is ordered. if fixed in future versions of jQ look here first.
						var mainElement = nodelist.pop();
						nodelist = nodelist.reverse();
						nodelist.push(mainElement);

						if (previousTarget === ev.target && traversedParents < (nodelist.length - 1)) {
							traversedParents++;
							for (var i = 0, ii = traversedParents; i<ii; i++) {
								if (nodelist.length > 1) {
									nodelist.pop();
								}
							}
						} else {
							traversedParents = 0;
						}

						previousTarget = ev.target;

						editing = nodelist.join(' ');

						var regex = new RegExp(editing + " {[\\s\\S]*?}", 'gi'),
			    			html = style.html();

			    		if (html.match(regex)) {
			    			editor.getSession().setValue(html.match(regex)[0]);
			    		} else {
							editor.getSession().setValue(editing + ' {\n\n}');
			    		}

						ev.preventDefault();
					}
				});

				$('body').append('<div class="designer"><div id="editor"></div><i class="fa fa-pencil fa-2x"></i><i class="fa fa-save fa-2x"></i><i class="fa fa-code fa-2x"></i></div>');
				$('head').append('<style type="text/css" id="designer-style"></style>');

				style = $('#designer-style');	

				jQuery.get('/plugins/public/compiled.css', function(data) {
					style.html(data.toString());
				});

				designer = $('.designer .fa-pencil').on('click', function() {
					active = $(this).parent().toggleClass('active').hasClass('active');
				});

				designer = $('.designer .fa-code').on('click', function() {
					editor.getSession().setValue(style.html());
					editing = "all";
				});

				editor = ace.edit("editor");
			    //editor.setTheme("ace/theme/monokai");
			    editor.getSession().setMode("ace/mode/css");

			    editor.getSession().on('change', function(){
					// this is so stupidly useless
				});

				$('.designer .fa-save').on('click', function() {
					var regex = new RegExp(editing + "[\\s\\S]*?}", 'gi'),
			    		html = style.html();

			    	if (editing === null) {
			    		return;
			    	} else if (editing !== "all") {
			    		if (html.match(regex)) {
				    		style.html(html.replace(regex, editor.getValue()));
				    	} else {
				    		style.html(html + '\n' + editor.getValue());
				    	}	
			    	} else {
			    		style.html(editor.getValue());
			    	}
			    	
			    	socket.emit('admin.designer.save', style.html());
				});
			}
		});
	});
}());