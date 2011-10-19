
/**************************************************/
/*	Chromeio
/**************************************************/
jQuery(function($){
	
	/**************************************************/
	/*	Defaults
	/**************************************************/
	var chromeio = window.chromeio = {};
		chromeio.styles = {},
		chromeio.edit = {},
		chromeio.activeSelector,
		chromeio.activeProperty,
		chromeio.utils = {}; 
		
		chromeio.cache = {};
		chromeio.cache.editor = $(".editorInner");
		chromeio.cache.overlay = $(".overlay");
		chromeio.cache.overlay_tabs = $(".overlay .tab");
		
	/**************************************************/
	/* Utilities 
	/**************************************************/
	chromeio.utils.toggleOverlay = function(tab){
		if(typeof(tab) != "undefined")
			chromeio.cache.overlay_tabs.hide().find("."+tab+"Wrapper").show();
		if(chromeio.cache.overlay.is(":visible")){
			chromeio.cache.overlay.fadeOut(500);
		} else {
			chromeio.cache.overlay.fadeTo(500,1);
		}
	};
	
	/**************************************************/
	/* Bind to Events
	/**************************************************/
	$(".overlayClose").bind("click", function(e){
		e.preventDefault();
		chromeio.utils.toggleOverlay();	
	});
	
	$(".promptLoad").bind("click", function(e){
		e.preventDefault();
		chromeio.utils.toggleOverlay("load");
	});
	
	$(".promptOutput").bind("click", function(e){
		e.preventDefault();
		chromeio.utils.toggleOverlay("output");
	});
	

	
	/*
		Mimic Inspector hover
	*/
	$('li').hover(function() {
		$(this).addClass('hovered');
	}, function() {
		$(this).removeClass('hovered');
	});
	
	
	/*
		Mimic webkit current selected line
	*/
	/*
		$('li').click(function() {
			$('.selected').removeClass('selected');
			$(this).addClass('selected');
		});	
	*/
	
	
	/*
		Mimic inspector element finder
	*/
	$("[class^=webkit], #elements-content2").hover(function(e) {
		e.stopPropagation();
		$('.elHov').removeClass('elHov');
		$(this).addClass('elHov');
	}, function(e) {
		e.stopPropagation();
		$('.elHov').removeClass('elHov');
		$(this).removeClass('elHov');
	});
	
	
	/*
		Finding the class name
	*/ 
	$("[class^=webkit]").click(function(e) {
		e.stopPropagation();
		var classy = this.className.match(/webkit-[\w-]*/) + '';		
		if (!chromeio.styles[classy]) {
			// console.log('nothing found for '+ classy);
			// console.log( $('.'+classy).first() );
			chromeio.utils.extendNamespace(classy);
		} else {
		 	// console.log('found it! we will update your styles', chromeio.styles[classy]);
		}
		chromeio.viewStyles(chromeio.styles[classy]);
	});
	
	
	/* 
		View & Edit Styles Pane 
	*/
	chromeio.viewStyles = function(obj) {
		if(!$('#'+obj.name)[0]){
			var html = "<div class='element' id='"+obj.name+"'><h3>"+ obj.name +"</h3><ul>";
			for (key in obj) {
				if (obj.hasOwnProperty(key) && key !== "name") {
					html += "<li><label>" + key.substr(0, 1).toUpperCase() + key.substr(1, key.length) + "</label>: <input type='text' data-cssselector='"+ obj.name +"' data-cssproperty='"+key+"' class='colorwheel' style='background: "+chromeio.styles[obj.name][key]+";' value='" + obj[key] + "' /></li>";
				}
			}
			html += "</ul><a href='#' class='addStyle btn' data-cssselector='"+ obj.name +"'>Add Attribute </a></div>";
			chromeio.cache.editor.append(html);
			chromeio.utils.startColorPicker();
		}
		
		// open
		
		var el = $("#"+obj.name); 
		$('.element').not(el).removeClass("open");
		$(el).addClass("open");
	}
	
	/* 
		Element Input Boxes 
	*/
	
	$(".element input").live('focus',function() {
		var that = $(this),
			cssselector =  that.data('cssselector'),
			cssproperty =  that.data('cssproperty');
		
		$('input.active').removeClass('active');
		that.addClass('active'); 

		// make sure we have that object
		if (!chromeio.styles[cssselector]) {  chromeio.utils.extendNamespace(cssselector);  }; 
		chromeio.activeSelector = that.data('cssselector');
		chromeio.activeProperty = that.data('cssproperty');
		log('set the active states');
	});

	$(".element h3").live('click', function() {
		var el = $(this).parents(".element");
		if(!el.hasClass("open")){
			$('.element').not(el).removeClass("open");
			el.addClass("open");
		} else {
			el.removeClass("open");
		}
	});
	

	/*
		Text Inputs

	*/ 
	$(".textBind").live('keyup', function() {
		var val = $(this).val() + " !important"; 
		log('key up on text bind', $(this).val());
		$('.'+chromeio.activeSelector).css(chromeio.activeProperty, val);
		chromeio.styles[chromeio.activeSelector][chromeio.activeProperty] = val;
	});

	
	/*
		Load External JSON Styles
	*/

	$("#loadStyle").bind("click", function(e) {
		e.preventDefault();
		chromeio.utils.loadStyle($('#styleInput').val());	
	});


	/* 
		Generate CSS! 
	*/
	
	$("#generate").bind("click", function(e) {
		e.preventDefault();
		$("#output").html(chromeio.utils.generateCSS()); 
	});


	/* 
		Chromeio Utils 
	*/

		chromeio.utils.extendNamespace = function(classy) {
			chromeio.styles[classy] = {
				"name" : classy,
				"color" : "",
				"backgroundColor" : ""
			};	
		}

		chromeio.utils.generateCSS = function() {
			var html = "/* \n \t Generated by Chromeio! \n\t http://chrome.io \n\t Coppyright 2011 Wes Bos <wes@wesbos.com> & Darcy Clarke <darcy@darcyclarke.me>  \n\t https://github.com/wesbos/chromeio \n\n\t You Can load this into the editor by copying and pasting the following json string: \n\n\t" + JSON.stringify(chromeio.styles) + " \n\n */ \n\n "; 
			for (var key in chromeio.styles) {
				// open selector
				switch(key) {
					case "source-code":
						html += "\n#elements-content."+key+ " {";
						break;
					default: 
						html += "\n#elements-content ."+key+ " {";
				}

				// add each propery and value
				var obj = chromeio.styles[key];
				for (var prop in obj) {
					property = chromeio.utils.toDash( (prop + "") );
					if (prop !== "name" && obj[prop] !== "") { 
						html += "\n\t" + property + " : " + obj[prop] + " !important;";
					 };
				}
				// close Selector
		    	html += "\n}";
			}
			return html; 
		}

		chromeio.utils.oppositeHex = function(colour) {
			
			function decimalToHex(decimal) {
				var hex = decimal.toString(16);
				if (hex.length == 1) hex = '0' + hex;
				return hex;
			}

			function hexToDecimal(hex) {return parseInt(hex,16);}

			return decimalToHex(255 - hexToDecimal(colour.substr(0,2))) 
			+ decimalToHex(255 - hexToDecimal(colour.substr(2,2))) 
			+ decimalToHex(255 -  hexToDecimal(colour.substr(4,2)));
		}
	

		/* 
			Colour Picker - Yeah - thats ColoUr 
		*/ 
		
		chromeio.utils.startColorPicker = function() {
			$('.colorwheel').ColorPicker({
				onSubmit: function(hsb, hex, rgb, el) {
					$(el).val(hex);
					$(el).ColorPickerHide();
				},
				onBeforeShow: function () {
					$(this).ColorPickerSetColor(this.value);
				},
				onChange: function (hsb, hex, rgb, el) {
					// input box color
					oppositeHex = chromeio.utils.oppositeHex(hex); 
					$('.active').val(hex).css({ backgroundColor : "#" +hex, color : "#" + oppositeHex });
					$('.'+chromeio.activeSelector).css(chromeio.activeProperty, '#' + hex);
					chromeio.styles[chromeio.activeSelector][chromeio.activeProperty] = '#' + hex;
				}
			})
			.bind('keyup', function(){
				$(this).ColorPickerSetColor(this.value);
			});
		};

		
		/* 
			Load External JSON Styles
		*/

		chromeio.utils.loadStyle =  function(json) {
			delete(chromeio.styles); 	
			$("[class^=webkit]").attr('style','');
			chromeio.styles = JSON.parse(json);

			for (var key in chromeio.styles) {
				// add each propery and value
				var obj = chromeio.styles[key];
				for (var prop in obj) {
					if(obj[prop] && prop !== "name" ) {
						args = {};
						args[prop] = [obj[prop]]; 
						$('.' + obj['name'] ).css(args);
					}
				}
			}
		}

		/* 
			Add Attribute
		*/

		chromeio.utils.addAttribute =  function(selector) {
			var property = prompt('What CSS Property?');
			var attrType = prompt("Wat Kind of Attribute? (colorpicker or textBind) ");
			$('#'+selector+ ' ul').append('<li><label>'+property.substr(0, 1).toUpperCase()+property.substr(1,property.length)+'</label><input type="text" data-cssselector="'+selector+'" data-cssproperty="'+property+'" class="'+attrType+'" value="" /></li>');
			//$('#'+selector+ ' ul').append('<li>wat</li>');	
	}

		$('.addStyle').live('click',function() { chromeio.utils.addAttribute( $(this).data('cssselector') ) });


	
	/* Init */
	chromeio.utils.startColorPicker();

	chromeio.utils.toDash = function(arg){
		return arg.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
	};
	
		
});