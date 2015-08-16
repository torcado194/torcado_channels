//* TITLE torcado_channels **//
//* VERSION 1.0.0 REV A **//
//* DESCRIPTION Custom Dashboard Channels **//
//* DEVELOPER torcado **//
//* FRAME false **//
//* BETA false **//

//var addChannelHTML = "<div class=\"torcado_addUserWrapper\"><div class=\"torcado_addUserButton\"><div class=\"torcado_addUserButtonIconBefore\"></div><div class=\"torcado_addUserButtonIconAfter\"></div></div><div class=\"torcado_addUserChannels\"></div></div>";
var channels = [];
var postsAddedBuffer = false;
var newPostCount = 0;
var consecutive_load_count = 0;
var settings = {
	filterPosts: false,
	colorPosts: true
};
var postsPerPage = 10;
var showRefreshWarning = false;

XKit.extensions.torcado_channels = new Object({
	//Variable initialization
	running: false,
	
	addChannelHTML: "<div class=\"torcado_addUserWrapper\"><div class=\"torcado_addUserButton\"><div class=\"torcado_addUserButtonIconBefore\"></div><div class=\"torcado_addUserButtonIconAfter\"></div></div><div class=\"torcado_addUserChannels\"><span class=\"torcado_addUserChannelsSpan\"></span></div></div>",
	previewAddChannelHTML: "<div class=\"torcado_addUserChannels\"></div>",
	/*
	channels: [],
	postsAddedBuffer: false,
	newPostCount: 0,
	consecutive_load_count: 0,
	settings: {
		filterPosts: false,
		colorPosts: true
	},
	postsPerPage: 10,
	*/
	//Channel object reference
	Channel: function (name, color, isOn, blogs) {
		this.name = name;
		this.color = color;
		this.isOn = isOn;
		this.blogs = blogs;
	},
	
	preferences: {
		"sep0":{
			text: "(refresh after changing values)",
			type: "separator"
		},
		"remove": {
			text: "when unchecked, hides filtered posts instead of removing them, removing the need to refresh (EXPERIMENTAL. MAY REALLY HINDER PERFORMANCE)",
			default: true,
			value: true
		},
		"postsPerPage": {
			text: "Posts per page: <br/>Number of posts to wait for before concidered<br/>a 'full page' to push to the dashboard when<br/>filtering posts (default 10)",
			default: "10",
			value: "10",
			type: "text"
		}
	},
	
	run: function () {
		//Start running
		this.running = true;
		
		//Check URL
		//+ Run main functions only in dashboard
		//+ Run specific page alterations in following pages:
		//++ /following
		var url = window.location.href;
		if (url.indexOf("https://www.tumblr.com/dashboard") > -1 || url.indexOf("http://www.tumblr.com/dashboard") > -1){
			
			//Check storage for existing data, set to default if blank, otherwise import data
			if ((XKit.storage.get("torcado_channels", "channels", false)) == "" || null || false){
				channels = [];
			} else {
				channels = XKit.storage.get("torcado_channels", "channels", channels);
			}
			if ((XKit.storage.get("torcado_channels", "settings", false)) == "" || null || false){
				settings = {
					filterPosts: false,
					colorPosts: true
				};
			} else {
				settings = XKit.storage.get("torcado_channels", "settings", settings);
			}
			//Run main function for setup, DOM manipulation, and user input
			XKit.extensions.torcado_channels.torcado_init();
			//Welcome message
			console.log("torcado channels is running! Thanks for trying it out");
			//Initialize css
			XKit.tools.init_css("torcado_channels");
			//Listen for newly added posts
			XKit.post_listener.add("torcado_channels", XKit.extensions.torcado_channels.filter_posts);
			//Filter posts on first pass
			XKit.extensions.torcado_channels.filter_posts();
		} else if(url.indexOf("https://www.tumblr.com/following") > -1 || url.indexOf("http://www.tumblr.com/following") > -1){
			console.log("IN 'FOLLOWING' PAGE");
			if ((XKit.storage.get("torcado_channels", "channels", false)) == "" || null || false){
				channels = [];
			} else {
				channels = XKit.storage.get("torcado_channels", "channels", channels);
			}
			if ((XKit.storage.get("torcado_channels", "settings", false)) == "" || null || false){
				settings = {
					filterPosts: false,
					colorPosts: true
				};
			} else {
				settings = XKit.storage.get("torcado_channels", "settings", settings);
			}
			XKit.tools.init_css("torcado_channels");
			XKit.extensions.torcado_channels.following_page_manipulation();
		} else {
			console.log("NOT IN DASHBOARD");
			console.log(window.location.href);
		}
		XKit.extensions.torcado_channels.blog_preview_observe();
		XKit.extensions.torcado_channels.channel_button_detection();
	},
	
	torcado_init: function () {
		//Variable initialization
		var newChannelPreviewColor = "#FFFFFF";
		var channelSettingsPreviewColor = "#FFFFFF";
		var settingsBlogArray = [];
		var settingsChannelName = "";
		var settingsChannelColor = "";
		//Element for placeholder objects
		$("body").prepend("<div id=\"torcado_tempHolder\"></div>");
		//Control Panel Element
		$("#new_post_buttons").after(
			"<div id=\"torcado_controlPanel\"><div class=\"torcado_controlPanelMain\"></div><div class=\"torcado_controlPanelSettingsWrapper\"><div class=\"torcado_controlPanelExportButton\"></div><div class=\"torcado_controlPanelSwitchWrapper\"><p>color posts:</p><div class=\"torcado_controlPanelSwitchBorder\" setting=\"colorPosts\"  state=\"on\"><div class=\"torcado_controlPanelSwitchBar\"></div></div></div><div class=\"torcado_controlPanelSwitchWrapper\"><div class=\"torcado_controlPanelSwitchHighlight\"></div><p>filter posts:</p><div class=\"torcado_controlPanelSwitchBorder\" setting=\"filterPosts\" state=\"on\"><div class=\"torcado_controlPanelSwitchBar\"></div></div></div></div><div class=\"torcado_controlPanelSidebar\"><div class=\"torcado_controlPanelIconWrapper\"><div class=\"torcado_controlPanelIconOutline\"></div><div class=\"torcado_controlPanelIconColor1\"></div><div class=\"torcado_controlPanelIconColor2\"></div><div class=\"torcado_controlPanelIconColor3\"></div><div class=\"torcado_controlPanelIconColor4\"></div></div><div class=\"torcado_controlPanelSidebarIcons\"><div class=\"torcado_refreshWarning\"><div class=\"torcado_tooltip\">A refresh is required to update changes. (read more about what this means <a>here</a>)</div></div></div></div></div>"
		);
		$(".torcado_controlPanelSwitchHighlight").hide();
		$(".torcado_tooltip").hide();
		$(document).on("mouseenter", ".torcado_refreshWarning", function (event) {
			$(".torcado_tooltip", this).fadeIn(200);
		});
		$(document).on("mouseleave", ".torcado_refreshWarning", function (event) {
			$(".torcado_tooltip", this).fadeOut(200);
		});
		
		$(".torcado_controlPanelIconColor1").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
		$(".torcado_controlPanelIconColor2").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
		$(".torcado_controlPanelIconColor3").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
		$(".torcado_controlPanelIconColor4").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
		$(document).on("click", ".torcado_controlPanelIconWrapper", function (event) {
			$(".torcado_controlPanelIconColor1").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
			$(".torcado_controlPanelIconColor2").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
			$(".torcado_controlPanelIconColor3").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
			$(".torcado_controlPanelIconColor4").css({"background-color": "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),90 - (Math.random() * 35),65 - (Math.random() * 25))});
		});
		//Remove and add control panel elements
		XKit.extensions.torcado_channels.updateControlPanel();
		
		//Switch functions
		$(".torcado_controlPanelSwitchBorder").each(function (event) {
			console.log(settings[$(this).attr("setting")]);
			if (settings[$(this).attr("setting")]) {
				$(this).attr("state", "on");
				$(".torcado_controlPanelSwitchBar", this).css({
					"left": "31px",
					"background-color": "rgb(82, 158, 204)",
					"border-radius": "0 3px 3px 0"
				});
			} else {
				$(this).attr("state", "off");
				$(".torcado_controlPanelSwitchBar", this).css({
					"left": "-1px",
					"background-color": "rgb(255, 255, 255)",
					"border-radius": "3px 0 0 3px"
				});
			}
		});
		$(document).on("click", ".torcado_controlPanelSwitchBorder", function (event) {
			console.log($(this).attr("state"));
			if ($(this).attr("state") == "on") {
				$(this).attr("state", "off");
				$(".torcado_controlPanelSwitchBar", this).css({
					"left": "-1px",
					"background-color": "rgb(255, 255, 255)",
					"border-radius": "3px 0 0 3px"
				});
				settings[$(this).attr("setting")] = false;
				if($(this).attr("setting") == "filterPosts"){
					/*$(this).siblings(".torcado_controlPanelSwitchHighlight").hide();*/
					$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
				}
			} else {
				$(this).attr("state", "on");
				$(".torcado_controlPanelSwitchBar", this).css({
					"left": "31px",
					"background-color": "rgb(82, 158, 204)",
					"border-radius": "0 3px 3px 0"
				});
				settings[$(this).attr("setting")] = true;
				if($(this).attr("setting") == "filterPosts"){
					/*$(this).siblings(".torcado_controlPanelSwitchHighlight").show();*/
					$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
				}
			}
			XKit.extensions.torcado_channels.channelsUpdated();
		});
		$(document).on("submit", "#torcado_controlPanelChannelAddForm", function (event) {
			event.preventDefault();
			XKit.extensions.torcado_channels.add_blog_form_submit(this);
			$(this).closest("#torcado_controlPanelChannelAddInputWrapper").hide();
			XKit.extensions.torcado_channels.channelsUpdated();
			if(settings["filterPosts"]){
				$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
			}
		});
		$("#torcado_tempHolder").append("<div id=\"torcado_controlPanelChannelAddInputWrapper\"><div class=\"torcado_triTopOuter\"><div class=\"torcado_triTopInner\"></div></div><form id=\"torcado_controlPanelChannelAddForm\" name=\"BOOBS\" action=\"javascript:void(0);\" method=\"get\"><input id=\"torcado_controlPanelChannelAddFormInput\" class=\"torcado_controlPanelChannelAddFormInput\" type=\"text\" name=\"inputForm\" placeholder=\"add blogs (comma separated)\" value=\"\"/><span style=\"display:none\"></span><input class=\"torcado_controlPanelChannelAddFormButton\" type=\"submit\" value=\"\"/></form></div>");
		var $addBlogForm = $("#torcado_controlPanelChannelAddInputWrapper");
		torcado_controlPanelChannelAddFormInput.addEventListener('input', function () {
			resizeText(this)
		}, true);
		function resizeText(form) {
			var inputData = form.value;
			var $span = $(form).parent().find('span');
			$span.text($(form).val());
			var $inputSize = $span.width() + 32;
			if ($inputSize > 210) {
				$(form).css("width", $inputSize);
			} else {
				$(form).css("width", 210);
			}
		}
		torcado_controlPanelChannelAddFormInput.addEventListener('input', function() {
		  var c = this.selectionStart,
			  r = /[^a-z0-9,-]/gi,
			  v = $(this).val();
		  if(r.test(v)) {
			$(this).val(v.replace(r, ''));
			c--;
		  }
		  this.setSelectionRange(c, c);
		});
		$("#torcado_tempHolder")[0].appendChild($addBlogForm[0]);
		$addBlogForm.hide();
		$(document).on("click", ".torcado_controlPanelChannelAddButton", function (event) {
			$(this).closest(".torcado_controlPanelChannelButtonWrapper")[0].appendChild($addBlogForm[0]);
			$addBlogForm.stop(true, false).fadeIn(200)
			$("#torcado_controlPanelChannelAddFormInput").focus();
		});
		$("#torcado_tempHolder").append("<div id=\"torcado_channelSettingsWrapper\"><div class=\"torcado_triLeftOuter\"><div class=\"torcado_triLeftInner\"></div></div><input id=\"torcado_channelSettingsNameForm\" placeholder=\"channel name\"><div class=\"torcado_channelSettingsRandomizeColor\"></div></input><input id=\"torcado_channelSettingsColorForm\" placeholder=\"hex color\"></input><div class=\"torcado_channelSettingsBlogListWrapper\"><div class=\"torcado_channelSettingsBlogList\"><div class=\"torcado_channelSettingsBlogWrapper\"><div class=\"torcado_channelSettingsRemoveButton\"></div><div class=\"torcado_channelSettingsBlogName\">blog name</div></div></div></div><div class=\"torcado_button torcado_channelSettingsCancel\">cancel</div><div class=\"torcado_button torcado_channelSettingsDelete\">delete</div><div class=\"torcado_button torcado_channelSettingsSave\">save</div></div>");
		var $channelSettingsForm = $("#torcado_channelSettingsWrapper");
		torcado_channelSettingsNameForm.addEventListener('input', function () {
			var c = this.selectionStart,
				r = /[^a-z0-9,!@#$%^&*()+=_? -]/gi,
				v = $(this).val();
			if (r.test(v)) {
				$(this).val(v.replace(r, ''));
				c--;
			}
			this.setSelectionRange(c, c);
			$(this).closest(".torcado_controlPanelChannelButtonWrapper").find(".torcado_controlPanelChannelButtonText").text(this.value);
		});
		torcado_channelSettingsColorForm.addEventListener('input', function () {
			var c = this.selectionStart,
				r = /[^a-f0-9#]/gi,
				v = $(this).val();
			if (r.test(v)) {
				$(this).val(v.replace(r, ''));
				c--;
			}
			this.setSelectionRange(c, c);
			$(this).closest(".torcado_controlPanelChannelButtonWrapper").find(".torcado_controlPanelChannelButton").css({"background-color": this.value});
		});
		$("#torcado_tempHolder")[0].appendChild($channelSettingsForm[0]);
		$channelSettingsForm.hide();
		$(document).on("click", ".torcado_controlPanelChannelSettingsButton", function (event) {
			settingsBlogArray = XKit.extensions.torcado_channels.getBlogsInChannel($(this).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel"));
			settingsChannelName = $(this).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel");
			settingsChannelColor = XKit.extensions.torcado_channels.rgbToHex($(this).closest(".torcado_controlPanelChannelButtonWrapper").find(".torcado_controlPanelChannelButton").css("backgroundColor"));
			$(this).closest(".torcado_controlPanelChannelButtonWrapper")[0].appendChild($channelSettingsForm[0]);
			$("#torcado_channelSettingsNameForm").val(settingsChannelName);
			$("#torcado_channelSettingsColorForm").val(settingsChannelColor);
			$channelSettingsForm.stop(true, false).fadeIn(200);
			XKit.extensions.torcado_channels.updateChannelSettingsList(settingsBlogArray);
		});
		$(document).on("click", ".torcado_channelSettingsRemoveButton", function (event) {
			settingsBlogArray.splice(settingsBlogArray.indexOf($(this).closest(".torcado_channelSettingsBlogWrapper").attr("blog")), 1)
			XKit.extensions.torcado_channels.updateChannelSettingsList(settingsBlogArray);
		});
		$(".torcado_controlPanelNewChannelButton").append("<div id=\"torcado_newChannelWrapper\"><div class=\"torcado_triLeftOuter\"><div class=\"torcado_triLeftInner\"></div></div><form id=\"torcado_newChannelForm\" method=\"get\" action=\"javascript:void(0);\"><input id=\"torcado_newChannelFormInput\" class=\"torcado_newChannelFormInput\" name=\"inputForm\" placeholder=\"channel name\" value=\"\" type=\"text\"></form><div class=\"torcado_newChannelButtonPreviewWrapper\"><div class=\"torcado_newChannelButtonPreviewBackground\"><div class=\"torcado_newChannelButtonPreviewBorder\"><div class=\"torcado_newChannelButtonPreviewText\"></div></div></div><div class=\"torcado_newChannelRandomizeColor\"></div><input id=\"torcado_newChannelButtonColorForm\" placeholder=\"hex color\"></input></div><div class=\"torcado_button torcado_newChannelSave\">save</div></div>");
		torcado_newChannelButtonColorForm.addEventListener('input', function () {
			updatePreviewColor(this)
		}, true);
		function updatePreviewColor(form) {
			var inputData = form.value;
			if (inputData == "") {
				$(form).closest("#torcado_newChannelWrapper").find(".torcado_newChannelButtonPreviewBackground").css({
					"background-color": newChannelPreviewColor
				});
			} else {
				$(form).closest("#torcado_newChannelWrapper").find(".torcado_newChannelButtonPreviewBackground").css({
					"background-color": inputData
				});
			}
		}
		torcado_newChannelFormInput.addEventListener('input', function () {
			updatePreviewName(this)
		}, true);
		function updatePreviewName(form) {
			var inputData = form.value;
			$(form).closest("#torcado_newChannelWrapper").find(".torcado_newChannelButtonPreviewText").text(inputData);
		}
		var $newChannelForm = $("#torcado_newChannelWrapper");
		$newChannelForm.hide();
		$(document).on("click", ".torcado_controlPanelNewChannelButton", function (event) {
			if (event.target == this) {
				console.log("FDGDGR");
				$(this)[0].appendChild($newChannelForm[0]);
				$newChannelForm.stop(true, false).fadeIn(200);
				$("#torcado_newChannelFormInput").focus();
				if (torcado_newChannelButtonColorForm.value == "" || torcado_newChannelButtonColorForm.value == newChannelPreviewColor) {
					newChannelPreviewColor = "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),100 - (Math.random() * 80),95 - (Math.random() * 20));
					$("#torcado_newChannelButtonColorForm").val(newChannelPreviewColor);
				} else {
					newChannelPreviewColor = torcado_newChannelButtonColorForm.value;
				}
				$(this).find(".torcado_newChannelButtonPreviewBackground").css({
					"background-color": newChannelPreviewColor
				});
				updatePreviewName(torcado_newChannelFormInput);
			}
		});
		$(document).on("click", ".torcado_newChannelRandomizeColor", function (event) {
			newChannelPreviewColor = "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),100 - (Math.random() * 80),95 - (Math.random() * 20));
			$("#torcado_newChannelButtonColorForm").val(newChannelPreviewColor);
			$(this).prev().css({
				"background-color": newChannelPreviewColor
			});
		});
		torcado_newChannelFormInput.addEventListener('input', function() {
		  var c = this.selectionStart,
			  r = /[^a-z0-9,!@#$%^&*()+=_? -]/gi,
			  v = $(this).val();
		  if(r.test(v)) {
			$(this).val(v.replace(r, ''));
			c--;
		  }
		  this.setSelectionRange(c, c);
		});
		torcado_newChannelButtonColorForm.addEventListener('input', function() {
		  var c = this.selectionStart,
			  r = /[^a-f0-9#]/gi,
			  v = $(this).val();
		  if(r.test(v)) {
			$(this).val(v.replace(r, ''));
			c--;
		  }
		  this.setSelectionRange(c, c);
		});
		$(document).mousedown(function (event) {
			if (!$(event.target).closest('.torcado_controlPanelChannelAddButton').length && !$(event.target).closest('#torcado_controlPanelChannelAddInputWrapper').length) {
				if ($('#torcado_controlPanelChannelAddInputWrapper').is(":visible")) {
					$('#torcado_controlPanelChannelAddInputWrapper').fadeOut(200);
				}
			}
			if (!$(event.target).closest('.torcado_controlPanelChannelSettingsButton').length && !$(event.target).closest('#torcado_channelSettingsWrapper').length) {
				if ($('#torcado_channelSettingsWrapper').is(":visible")) {
					$('#torcado_channelSettingsWrapper').fadeOut(200);
					XKit.extensions.torcado_channels.channelsUpdated();
				}
			}
			if (!$(event.target).closest('.torcado_controlPanelNewChannelButton').length && !$(event.target).closest('#torcado_newChannelWrapper').length) {
				if ($('#torcado_newChannelWrapper').is(":visible")) {
					$('#torcado_newChannelWrapper').fadeOut(200);
				}
			}
			//if ((($(event.target).closest('.torcado_addUserButton').length > 0 && $(event.target).closest(".torcado_addUserWrapper").find(".torcado_addUserChannels").height() > 0) || !$(event.target).closest('.torcado_addUserButton').length) && !$(event.target).closest('.torcado_addUserChannels').length) {
			if (!$(event.target).closest('.torcado_addUserChannels').length) {
				$(".torcado_addUserChannels").css({
					"height": "0"
				});
				$(".torcado_addUserButtonIconBefore").css({
					"transform": ""
				});
				$(".torcado_addUserButton").css({"width": ""});
			}
			console.log($(event.target));
		});
		$(document).on("click", ".torcado_channelSettingsRandomizeColor", function (event) {
			channelSettingsPreviewColor = "#" + XKit.extensions.torcado_channels.hslToHex((Math.random() * 360),100 - (Math.random() * 80),95 - (Math.random() * 20));
			$("#torcado_channelSettingsColorForm").val(channelSettingsPreviewColor);
			$(this).closest(".torcado_controlPanelChannelButtonWrapper").find(".torcado_controlPanelChannelButton").css({
				"background-color": channelSettingsPreviewColor
			});
		});
		$(document).on("click", ".torcado_newChannelSave", function (event) {
			var newChannelName = torcado_newChannelFormInput.value;
			var newChannelColor = torcado_newChannelButtonColorForm.value;
			var rxValidHex = /^#(?:[0-9a-f]{3}){1,2}$/i;
			if (XKit.extensions.torcado_channels.channelExists(newChannelName)){
				alert("Channel Alredy Exists");
			} else {
				if (newChannelColor == "") {
					torcado_newChannelFormInput.value = "";
					torcado_newChannelButtonColorForm.value = "";
					channels.push(new XKit.extensions.torcado_channels.Channel(newChannelName, newChannelPreviewColor, true, []));
					XKit.extensions.torcado_channels.updateControlPanel();
					XKit.extensions.torcado_channels.channelsUpdated();
					XKit.extensions.torcado_channels.updateChannelButtonHTML();
				} else {
					if (rxValidHex.test(newChannelColor)) {
						torcado_newChannelFormInput.value = "";
						torcado_newChannelButtonColorForm.value = "";
						channels.push(new XKit.extensions.torcado_channels.Channel(newChannelName, newChannelColor, true, []));
						XKit.extensions.torcado_channels.updateControlPanel();
						XKit.extensions.torcado_channels.channelsUpdated();
						XKit.extensions.torcado_channels.updateChannelButtonHTML();
					} else {
						alert("Invalid CSS Hex Color");
					}
				}
			}
			if(settings["filterPosts"]){
				$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
			}
		});
		$(document).on("click", ".torcado_channelSettingsCancel", function (event) {
			$('#torcado_channelSettingsWrapper').fadeOut(200);
			XKit.extensions.torcado_channels.channelsUpdated();
		});
		$(document).on("click", ".torcado_channelSettingsSave", function (event) {
			var newName = torcado_channelSettingsNameForm.value;
			var newColor = torcado_channelSettingsColorForm.value;
			var rxValidHex = /^#(?:[0-9a-f]{3}){1,2}$/i;
			if (XKit.extensions.torcado_channels.channelExists(newName) && $(this).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel") != newName){
				alert("Channel Alredy Exists");
			} else {
				if (rxValidHex.test(newColor)) {
					XKit.extensions.torcado_channels.removeBlogArrayFromChannel(settingsBlogArray, $(this).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel"));
					XKit.extensions.torcado_channels.changeChannelName($(this).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel"), newName);
					XKit.extensions.torcado_channels.changeChannelColor($(this).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel"), newColor);
					XKit.extensions.torcado_channels.channelsUpdated();
					XKit.extensions.torcado_channels.updateChannelButtonHTML();
				} else {
					alert("Invalid CSS Hex Color");
				}
			}
			if(settings["filterPosts"]){
				$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
			}
		});
		$(document).on("click", ".torcado_channelSettingsDelete", function (event) {
			if (confirm("Are you sure you want to delete this channel?")){
				XKit.extensions.torcado_channels.deleteChannel($(this).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel"));
				XKit.extensions.torcado_channels.updateChannelButtonHTML();
			}
			if(settings["filterPosts"]){
				$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
			}
		});
		$(document).on("click", ".torcado_controlPanelChannelButton", function (event) {
			if(event.shiftKey) {
				for (var i = 0; i < channels.length; i++) {
					if($(this).attr("channel") != channels[i].name){
						channels[i].isOn = false;
					} else {
						channels[i].isOn = true;
					}
				}
				if(channels.length > 1){
					//update refreshWarning
					if(settings["filterPosts"]){
						$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
					}
				}
			} else {
				XKit.extensions.torcado_channels.toggleChannelState($(this).attr("channel"));
				if (XKit.extensions.torcado_channels.buttonCheckChannelState($(this).attr("channel"))) {
					$(".torcado_controlPanelChannelButtonBorder", this).css({
						"background-color": "",
						"border-width": "1px 1px 4px"
					});
				} else {
					$(".torcado_controlPanelChannelButtonBorder", this).css({
						"background-color": "#FFF",
						"border-width": "1px 1px 2px"
					});
				}
				if(settings["filterPosts"]){
					$(".torcado_refreshWarning").stop(true,false).animate({"width": "24px", "height": "24px"}, '400');
				}
			}
			XKit.extensions.torcado_channels.channelsUpdated();
		});
		//TODO: maybe check for addUserChannels height. if >0, do nothing. if 0, expand
		$(document).on("click", ".torcado_addUserButton", function (event) {
			XKit.extensions.torcado_channels.updatePostChannelButtons($(this).closest(".post"));
			var buttonsHeight = $(this).next().find(".torcado_addUserChannelsSpan").height() + ($(this).next().find(".torcado_addUserChannelsSpan").children().length * 3) + 3;
			if(buttonsHeight > 300){
				buttonsHeight = 300
				$(this).next().css({
					"height": (buttonsHeight),
					"overflow-y": "scroll"
				});
			} else {
				$(this).next().css({
					"height": (buttonsHeight),
					"overflow-y": "hidden"
				});
			}
			$(this).children(".torcado_addUserButtonIconBefore").css({
				"transform": "rotate(90deg)"
			});
			$(this).css({"width": "64px"});
		});
		var originalExportString = "";
		$(document).on("click", ".torcado_controlPanelExportButton", function (event) {
			//TODO: POPUP
			XKit.extensions.torcado_channels.eventFire(document.getElementById("Compose-button"), "click");
			console.log($(".fast-compose"));
			$(".tab-post-types").remove();
			$("body").append("<div class=\"torcado_overlay\" style=\"display: none\"><div class=\"torcado_exportBox\"><div class=\"torcado_exportHeader\"><h1>Channel Data</h1></div><textarea id=\"torcado_exportTextarea\" class=\"torcado_exportInput\"></textarea><div class=\"torcado_exportDescription\">Copy this data to store it elsewhere or import on a different computer/account.<br>Paste existing channel data or edit the data manually to change settings.</div><div class=\"torcado_exportControls\"><div class=\"torcado_button torcado_exportClose\"><p>Close</p></div><div class=\"torcado_button torcado_exportImport\"><p>Import</p></div></div></div></div>");
			$(".torcado_overlay").fadeIn(400);
			$(".torcado_exportImport").addClass("torcado_buttonDisabled");
			originalExportString = JSON.stringify(XKit.storage.get("torcado_channels", "channels", false))
			torcado_exportTextarea.value = originalExportString;
			
			torcado_exportTextarea.addEventListener('input', function() {
				if(torcado_exportTextarea.value == originalExportString){
					$(".torcado_exportImport").addClass("torcado_buttonDisabled");
				} else {
					$(".torcado_exportImport").removeClass("torcado_buttonDisabled");
				}
			});
		});
		$(document).on("click", ".torcado_exportImport", function (event) {
			if(!($(this).hasClass("torcado_buttonDisabled"))){
				if(confirm("Are you sure you want to import this data? (BE CAREFUL WHEN IMPORTING BAD DATA, I suggest saving the original data elsewhere just in case)")){
					console.log(document.getElementById("torcado_exportTextarea").value);
					XKit.storage.set("torcado_channels", "channels", JSON.parse(document.getElementById("torcado_exportTextarea").value));
					console.log(XKit.storage.get("torcado_channels", "channels", channels));
					channels = XKit.storage.get("torcado_channels", "channels", channels);
					XKit.extensions.torcado_channels.eventFire(document.getElementsByClassName("post-tab-switching")[0], "click");
					XKit.extensions.torcado_channels.channelsUpdated();
					XKit.extensions.torcado_channels.updateChannelButtonHTML();
				}
			} else {
				debugger;
			}
		})
		$(document).on("click", ".torcado_exportClose", function (event) {
			XKit.extensions.torcado_channels.eventFire(document.getElementsByClassName("post-tab-switching")[0], "click");
		})
		$(document).click(function(event){
			if ($(event.target).hasClass('post-tab-switching')) {
				$(".torcado_overlay").fadeOut(400, function(){$(".torcado_overlay").remove()});
			}
		});
		//Post observer
		var insertedNodes = [];
		var observer = new MutationObserver(function (mutations) {
			insertedNodes = [];
			mutations.forEach(function (mutation) {
				for (var i = 0; i < mutation.addedNodes.length; i++) {
					insertedNodes.push(mutation.addedNodes[i]);
				};
				$(insertedNodes).each(function () {
					if ($(this).hasClass("post_container")){
						if(settings["filterPosts"]){
							$(this).hide();
							$(this).addClass("torcado_postWaiting");
						}
					} else if ($(this).hasClass("recommended-unit-container")){
						$(this).addClass("torcado_recommendedWaiting");
					}
					if($(this).nextAll("#torcado_controlPanel").length != 0){
						console.log($(this).nextAll());
						debugger;
						XKit.extensions.torcado_channels.resetControlPanelPosition();
					}
				});
			});
			XKit.extensions.torcado_channels.filter_waiting_posts();
		});
		var options = {
			subtree: false,
			childList: false,
			attributes: false
		};
		observer.observe(document.getElementById("posts"), {
			childList: true
		});
		
		$(window).load(function() {
			$("body").prepend("<div id=\"torcado_dashLengthen\" style=\"width: 1px; height: " + ($(window).height() + 10) + "px; position: absolute;\"></div>");
		});
		
		XKit.extensions.torcado_channels.updateChannelButtonHTML();
	},
	
	dashboard_manipulation: function(){
		
	},
		
	dashboard_listener: function(){
		
	},
	
	following_page_manipulation: function(){
		console.log(channels);
		XKit.extensions.torcado_channels.updateChannelButtonHTML();
		$(".follower").not("#invite_someone").each(function(){
			$(".info", this).after("<div class=\"torcado_followerAddButtonWrapper\"><div class=\"torcado_followerAddButton\"><div class=\"torcado_followerAddButtonPlusWrapper\"><div class=\"torcado_followerAddButtonPlusIcon\"></div></div></div><div class=\"torcado_followerAddUserChannels\"><span class=\"torcado_followerAddUserChannelsSpan\"></span></div></div>")
			$(".torcado_followerAddUserChannelsSpan", this).append(XKit.extensions.torcado_channels.addChannelHTML);
		});
		
		$(document).on("click", ".torcado_followerAddButton", function (event) {
			XKit.extensions.torcado_channels.updatePreviewChannelButtons($(this).closest(".follower").find(".name").text(), $(this).next());
			var buttonsHeight = $(this).next().find(".torcado_followerAddUserChannelsSpan").height() + ($(this).next().find(".torcado_followerAddUserChannelsSpan").children().length * 3) + 3;
			if(buttonsHeight > 400){
				buttonsHeight = 400
				$(this).next().css({
					"height": (buttonsHeight),
					"overflow-y": "scroll"
				});
			} else {
				$(this).next().css({
					"height": (buttonsHeight),
					"overflow-y": "hidden"
				});
			}
			$(this).closest(".torcado_followerAddButtonWrapper").css({
				"left": "-74px",
				"width": "64px",
				"margin-right": "-10px"
			});
		});
		$(document).mousedown(function (event) {
			if (!$(event.target).closest('.torcado_followerAddUserChannels').length) {
				$(".torcado_followerAddUserChannels").css({
					"height": "0"
				});
				$(".torcado_addUserButton").css({"width": ""});
				$(".torcado_followerAddButtonWrapper").css({"left": "", "width": "", "margin-right": ""});
			}
		});
	},
	
	resetControlPanelPosition: function(){
		
		$("#torcado_controlPanel").detach().insertAfter("#new_post_buttons");
	},
	
	channel_button_detection: function(){
		$(document).on("mouseenter", ".torcado_addUserChannelButton", function (event) {
			if($(this).closest(".post").length != 0){
				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog({
					name: $(this).closest(".post").attr("data-tumblelog-name"),
					key: $(this).closest(".post").attr("data-tumblelog-key")
				});
			} else if($(this).closest(".navigation").length != 0){
				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog_name($(this).closest(".navigation").find(".name").text());
			} else if($(this).closest(".follower").length != 0){
				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog_name($(this).closest(".follower").find(".name").text());
			}
			if (XKit.extensions.torcado_channels.buttonCheckChannel($(this).attr("channel"), checkBlog)) {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "#FFF"
				});
			} else {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": ""
				});
			}
		});
		$(document).on("mouseleave", ".torcado_addUserChannelButton", function (event) {
			if($(this).closest(".post").length != 0){
				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog({
					name: $(this).closest(".post").attr("data-tumblelog-name"),
					key: $(this).closest(".post").attr("data-tumblelog-key")
				});
			} else if($(this).closest(".navigation").length != 0){
				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog_name($(this).closest(".navigation").find(".name").text());
			} else if($(this).closest(".follower").length != 0){
				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog_name($(this).closest(".follower").find(".name").text());
			}
			if (XKit.extensions.torcado_channels.buttonCheckChannel($(this).attr("channel"), checkBlog)) {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": ""
				});
			} else {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "#FFF"
				});
			}
		});
		$(document).on("click", ".torcado_addUserChannelButton", function (event) {
			if($(this).closest(".post").length != 0){
				XKit.extensions.torcado_channels.toggleBlogInChannel({
					name: $(this).closest(".post").attr("data-tumblelog-name"),
					key: $(this).closest(".post").attr("data-tumblelog-key")
				}, $(this).attr("channel"));
				XKit.extensions.torcado_channels.update_posts($(this).closest(".post").attr("data-tumblelog-name"));

				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog({
					name: $(this).closest(".post").attr("data-tumblelog-name"),
					key: $(this).closest(".post").attr("data-tumblelog-key")
				});
			} else if($(this).closest(".navigation").length != 0){
				XKit.extensions.torcado_channels.toggleBlogInChannel({
					name: $(this).closest(".navigation").find(".name").text(),
					key: ""
				}, $(this).attr("channel"));
				XKit.extensions.torcado_channels.update_posts($(this).closest(".navigation").find(".name").text());

				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog_name($(this).closest(".navigation").find(".name").text());
			} else if($(this).closest(".follower").length != 0){
				XKit.extensions.torcado_channels.toggleBlogInChannel({
					name: $(this).closest(".follower").find(".name").text(),
					key: ""
				}, $(this).attr("channel"));
				XKit.extensions.torcado_channels.update_posts($(this).closest(".follower").find(".name").text());
				
				var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog_name($(this).closest(".follower").find(".name").text());
			}
			if (XKit.extensions.torcado_channels.buttonCheckChannel($(this).attr("channel"), checkBlog)) {
				$(".torcado_addUserChannelButtonText", this).css({
					"border-bottom": "4px solid rgba(0, 0, 0, 0.2)"
				});
			} else {
				$(".torcado_addUserChannelButtonText", this).css({
					"border-bottom": "2px solid rgba(0, 0, 0, 0.2)"
				});
			};
		});
	},
	
	blog_preview_observe: function(){
		var insertedNodes = [];
		var newPreviewObserver = new MutationObserver(function (mutations) {
			var previewButtonAdded = false;
			insertedNodes = [];
			mutations.forEach(function (mutation) {
				for (var i = 0; i < mutation.addedNodes.length; i++) {
					insertedNodes.push(mutation.addedNodes[i]);
					console.log(mutation.addedNodes[i]);
					if(($(mutation.addedNodes[i]).find(".navigation").length != 0) && !(previewButtonAdded)){
						//if ($(mutation.addedNodes[i]).hasClass("navigation")){
						//previewButtonAdded = true;
						console.log("SFEWFEWFWEFEW");
						console.log($(mutation.addedNodes[i]).find(".navigation"));
						$(mutation.addedNodes[i]).find(".navigation").append("<div class=\"torcado_blogPreviewAddButtonWrapper\"><div class=\"torcado_blogPreviewAddButton\"><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonPlusWrapper\"><div class=\"torcado_blogPreviewAddButtonPlusIcon\"></div></div></div><div class=\"torcado_blogPreviewAddUserChannels\"><span class=\"torcado_blogPreviewAddUserChannelsSpan\"></span></div></div>");
						$(mutation.addedNodes[i]).find(".torcado_blogPreviewAddUserChannelsSpan").append(XKit.extensions.torcado_channels.addChannelHTML);
					}
				};
			});
		});

		var previewObserver = new MutationObserver(function (mutations) {
			console.log(mutations);
			mutations.forEach(function (mutation) {
				for (var i = 0; i < mutation.addedNodes.length; i++) {
					console.log(mutation.addedNodes[i]);
					insertedNodes.push(mutation.addedNodes[i]);

					if($(mutation.addedNodes[i]).hasClass("tumblelog_popover")){
						if($(mutation.addedNodes[i]).find(".navigation").length != 0){
							$(mutation.addedNodes[i]).find(".navigation").append("<div class=\"torcado_blogPreviewAddButtonWrapper\"><div class=\"torcado_blogPreviewAddButton\"><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonPlusWrapper\"><div class=\"torcado_blogPreviewAddButtonPlusIcon\"></div></div></div><div class=\"torcado_blogPreviewAddUserChannels\"><span class=\"torcado_blogPreviewAddUserChannelsSpan\"></span></div></div>");
							$(mutation.addedNodes[i]).find(".torcado_blogPreviewAddUserChannelsSpan").append(XKit.extensions.torcado_channels.addChannelHTML);
						} else {
							console.log("NEW PREVIEW");
							console.log(mutation.addedNodes[i].parentNode)
							console.log(document.body)
							var curNode = mutation.addedNodes[i];
							console.log(curNode)
							newPreviewObserver.observe(mutation.addedNodes[i], {
								childList: true,
								subtree: true,
							});
						}
					}
				};
				for (var j = 0; j < mutation.removedNodes.length; j++) {
					console.log(mutation.removedNodes[i]);
					if($(mutation.removedNodes[i]).hasClass("tumblelog_popover")){
						//newPreviewObserver.disconnect();
					}
				};
			});
			//.tumblelog_popover
			//			console.log(mutations);
			//			console.log(insertedNodes);
		});
		previewObserver.observe(document.body, {
			childList: true
		});


		$(document).on("click", ".torcado_blogPreviewAddButton", function (event) {
			XKit.extensions.torcado_channels.updatePreviewChannelButtons($(this).closest(".navigation").find(".name").text(), $(this).next());
			var buttonsHeight = $(this).next().find(".torcado_blogPreviewAddUserChannelsSpan").height() + ($(this).next().find(".torcado_blogPreviewAddUserChannelsSpan").children().length * 3) + 3;
			if(buttonsHeight > 116){
				buttonsHeight = 116
				$(this).next().css({
					"height": (buttonsHeight),
					"overflow-y": "scroll"
				});
			} else {
				$(this).next().css({
					"height": (buttonsHeight),
					"overflow-y": "hidden"
				});
			}
		});
	},
	
	addBlogToChannel: function (blogs, channel) {
		var pushBlog = true;
		var sameKey = false;
		var sameName = false;
		var currBlog = [];
		var channelsUpdated = false;
		for (var i = 0; i < channels.length; i++) {
			for (var b = 0; b < blogs.length; b++) {
				currBlog = blogs[b];
				if (channels[i].name == channel) {
					for (var n = 0; n < channels[i].blogs.length; n++) {
						if ((blogs[b].key != "") && (channels[i].blogs[n].key == blogs[b].key)) {
							sameKey = true;
							pushBlog = false;
							break;
						}
						if (channels[i].blogs[n].name == blogs[b].name) {
							sameName = true;
							pushBlog = false;
							break;
						}
					}
					if (sameKey != sameName) {
						channels[i].blogs[n].key = blogs[b].key;
						channels[i].blogs[n].name = blogs[b].name;
						channelsUpdated = true;
					}
					if (sameKey && sameName) {
						console.log("ALREADY IN CHANNEL");
					}
					if ((!sameKey) && (!sameName)) {
						channels[i].blogs.push({
							name: blogs[b].name,
							key: blogs[b].key
						});
						channelsUpdated = true;
					}
				}
			}
		}
		if (channelsUpdated) {
			XKit.extensions.torcado_channels.channelsUpdated();
		}
	},
	
	removeBlogFromChannel: function (blog, channel) {
		var inChannel = false;
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].name == channel) {
				for (var n = 0; n < channels[i].blogs.length; n++) {
					if (channels[i].blogs[n].name == blog) {
						channels[i].blogs.splice(n, 1);
						inChannel = true;
						XKit.extensions.torcado_channels.channelsUpdated();
					}
				}
				if (!inChannel) {
					return false
				}
			}
		}
	},
	
	removeBlogArrayFromChannel: function (blogArray, channel) {
		var newBlogArray = [];
		console.log(channels);
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].name == channel) {
				for (var j = 0; j < blogArray.length; j++) {
					for (var n = 0; n < channels[i].blogs.length; n++) {
						if (channels[i].blogs[n].name == blogArray[j]) {
							newBlogArray.push(channels[i].blogs[n]);
							//channels[i].blogs.splice(n, 1);
						}
					}
				}
				channels[i].blogs = newBlogArray;
			}
		}
		XKit.extensions.torcado_channels.channelsUpdated();
	},
	
	changeChannelName: function(channel, name) {
		console.log(name);
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].name == channel) {
				channels[i].name = name;
				return true;
			}
		}
	},
	
	changeChannelColor: function(channel, color) {
		console.log(color);
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].name == channel) {
				channels[i].color = color;
				return true;
			}
		}
	},
	
	toggleBlogInChannel: function (blog, channel) {
		var inChannel = false;
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].name == channel) {
				for (var n = 0; n < channels[i].blogs.length; n++) {
					if (channels[i].blogs[n].name == blog.name) {
						inChannel = true;
						channels[i].blogs.splice(n, 1);
						XKit.extensions.torcado_channels.channelsUpdated();
						return true;
					}
				}
				if (!inChannel) {
					channels[i].blogs.push(blog);
					XKit.extensions.torcado_channels.channelsUpdated();
					return true;
				}
			}
		}
	},
	
	toggleChannelState: function (channel) {
		for (var i = 0; i < channels.length; i++) {
			if (channel == channels[i].name) {
				if (channels[i].isOn) {
					channels[i].isOn = false;
				} else {
					channels[i].isOn = true;
				}
				//XKit.extensions.torcado_channels.channelsUpdated();
				return true;
			}
		}
		return false;
	},
	
	deleteChannel: function(channel) {
		for (var i = 0; i < channels.length; i++) {
			if (channel == channels[i].name) {
				channels.splice(i, 1);
			}
		}
		XKit.extensions.torcado_channels.channelsUpdated();
	},
	
	channelExists: function(channel) {
		for (var i = 0; i < channels.length; i++) {
			if (channel == channels[i].name) {
				return true;
			}
		}
		return false;
	},
	
	channelsUpdated: function () {
		XKit.extensions.torcado_channels.filter_posts();
		XKit.storage.set("torcado_channels", "channels", channels);
		XKit.storage.set("torcado_channels", "settings", settings);
		XKit.extensions.torcado_channels.update_posts("");
		//XKit.extensions.torcado_channels.getChannelButtons();
		XKit.extensions.torcado_channels.updateControlPanel();
		//XKit.extensions.torcado_channels.updateChannelButtonHTML();
		console.log(channels);
	},
	
	updateChannelButtonHTML: function(){
		XKit.extensions.torcado_channels.addChannelHTML = "";
		for (var i = 0; i < channels.length; i++) {
			XKit.extensions.torcado_channels.addChannelHTML += "<div class=\"torcado_addUserChannelButton\" channel=\"" + channels[i].name + "\" style=\"background-color: " + channels[i].color + "\"><div class=\"torcado_addUserChannelButtonIndicator\"></div><div class=\"torcado_addUserChannelButtonText\">" + channels[i].name + "</div></div>";
		}
		$("li.post_container").not("#new_post_buttons, #new_post").has("div").each(function () {
			if($(this).find(".torcado_addUserChannels").length == 0) {
				
			} else {
				$(this).find(".torcado_addUserChannels").remove();
			}
			$(this).find(".torcado_addUserWrapper").append("<div class=\"torcado_addUserChannels\"><span class=\"torcado_addUserChannelsSpan\"></span></div>");
			$(this).find(".torcado_addUserChannelsSpan").append(XKit.extensions.torcado_channels.addChannelHTML);
			console.log(this);
		});
		$(".follower").each(function () {
			console.log("IF YOU SEE THIS, SET URL CONDITIONAL");
			if($(this).find(".torcado_followerAddUserChannels").length == 0) {
				
			} else {
				$(this).find(".torcado_followerAddUserChannels").remove();
			}
			$(this).find(".torcado_followerAddButtonWrapper").append("<div class=\"torcado_followerAddUserChannels\"><span class=\"torcado_followerAddUserChannelsSpan\"></span></div>");
			$(this).find(".torcado_followerAddUserChannelsSpan").append(XKit.extensions.torcado_channels.addChannelHTML);
		});
	},
	
	
	updatePostChannelButtons: function(post){
		var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog({
			name: $(post).attr("data-tumblelog-name"),
			key: $(post).attr("data-tumblelog-key")
		});
		/*if (XKit.extensions.torcado_channels.buttonCheckChannel($(post).attr("channel"), checkBlog)) {
			$(".torcado_addUserChannelButtonText", post).css({
				"background-color": "",
				"border-bottom": "4px solid rgba(0, 0, 0, 0.2)"
			});
		} else {
			$(".torcado_addUserChannelButtonText", post).css({
				"background-color": "#FFF",
				"border-bottom": "2px solid rgba(0, 0, 0, 0.2)"
			});
		}*/
		console.log(checkBlog);
		$(".torcado_addUserChannelButton", post).each(function () {
			if (XKit.extensions.torcado_channels.buttonCheckChannel($(this).attr("channel"), checkBlog)) {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "",
					"border-bottom": "4px solid rgba(0, 0, 0, 0.2)"
				});
			} else {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "#FFF",
					"border-bottom": "2px solid rgba(0, 0, 0, 0.2)"
				});
			}
		});
	},
	
	updatePreviewChannelButtons: function(blog, button){
		var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog_name(blog);
		$(".torcado_addUserChannelButton", button).each(function () {
			if (XKit.extensions.torcado_channels.buttonCheckChannel($(this).attr("channel"), checkBlog)) {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "",
					"border-bottom": "4px solid rgba(0, 0, 0, 0.2)"
				});
				console.log("yerp");
			} else {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "#FFF",
					"border-bottom": "2px solid rgba(0, 0, 0, 0.2)"
				});
				console.log("nop");
			}
		});
	},
	
	getChannelButtons: function () {
		var addChannelButtonsHTML = "<span class=\"torcado_addUserChannelsSpan\">";
		for (var i = 0; i < channels.length; i++) {
			addChannelButtonsHTML += "<div class=\"torcado_addUserChannelButton\" channel=\"" + channels[i].name + "\" style=\"background-color: " + channels[i].color + "\"><div class=\"torcado_addUserChannelButtonIndicator\"></div><div class=\"torcado_addUserChannelButtonText\">" + channels[i].name + "</div></div>";
		}
		addChannelButtonsHTML += "</span>";
		$(".torcado_addUserChannels").each(function () {
			$(this).html(addChannelButtonsHTML);
		});
		$(".torcado_addUserChannelButton").each(function () {
			var checkBlog = XKit.extensions.torcado_channels.channels_containing_blog({
				name: $(this).closest(".post").attr("data-tumblelog-name"),
				key: $(this).closest(".post").attr("data-tumblelog-key")
			});
			if (XKit.extensions.torcado_channels.buttonCheckChannel($(this).attr("channel"), checkBlog)) {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "",
					"border-bottom": "4px solid rgba(0, 0, 0, 0.2)"
				});
			} else {
				$(".torcado_addUserChannelButtonText", this).css({
					"background-color": "#FFF",
					"border-bottom": "2px solid rgba(0, 0, 0, 0.2)"
				});
			}
		});
	},
	
	updateControlPanel: function () {
		var controlPanelElements = "";
		$("#torcado_controlPanel .torcado_controlPanelMain").html("");
		for (var i = 0; i < channels.length; i++) {
			controlPanelElements += "<div class=\"torcado_controlPanelChannelButtonWrapper\" channel=\"" + channels[i].name + "\"><div class=\"torcado_controlPanelChannelButton\" channel=\"" + channels[i].name + "\" style=\"background-color: " + channels[i].color + "\"><div class=\"torcado_controlPanelChannelButtonBorder\"><div class=\"torcado_addUserChannelButtonIndicator\"></div><div class=\"torcado_controlPanelChannelButtonText\">" + channels[i].name + "</div></div></div><div class=\"torcado_controlPanelChannelSettingsWrapper\"><div class=\"torcado_controlPanelChannelSettingsButton\"></div><div class=\"torcado_controlPanelChannelAddButton\"></div></div></div>";
		}
		$("#torcado_controlPanel .torcado_controlPanelMain").append(controlPanelElements);
		$("#torcado_controlPanel .torcado_controlPanelMain").append("<div class=\"torcado_controlPanelNewChannelButton\"></div>");
		$(".torcado_controlPanelChannelButton").each(function () {
			if (!(XKit.extensions.torcado_channels.buttonCheckChannelState($(this).attr("channel")))) {
				$(".torcado_controlPanelChannelButtonBorder", this).css({
					"background-color": "#FFF",
					"border-width": "1px 1px 2px"
				});
			}
		});
	},
	
	updateChannelSettingsList: function(blogs){
		var $listElement = $("#torcado_channelSettingsWrapper").find(".torcado_channelSettingsBlogList");
		$listElement.html("");
		var blogList = "";
		for (var i = 0; i < blogs.length; i++) {
			blogList += "<div class=\"torcado_channelSettingsBlogWrapper\" blog=\"" + blogs[i] + "\"><div class=\"torcado_channelSettingsRemoveButton\"></div><div class=\"torcado_channelSettingsBlogName\">" + blogs[i] + "</div></div>";
		}
		$listElement.append(blogList);
	},
	
	getBlogsInChannel: function(channel){
		var blogs = [];
		for (var i = 0; i < channels.length; i++) {
			if (channel == channels[i].name) {
				for (var n = 0; n < channels[i].blogs.length; n++) {
					blogs.push(channels[i].blogs[n].name);
				}			
				break;
			}
		}
		return blogs;
	},

	add_blog_form_submit: function (form) {
		var formValue = form.inputForm.value;
		formValue = formValue.replace(/(^[,\s]+)|([,\s]+$)/g, '');
		var formChannel = $(form).closest(".torcado_controlPanelChannelButtonWrapper").attr("channel");
		var channels_array = formValue.split(',');
		for (var i = 0; i < channels_array.length; i++) {
			channels_array[i] = channels_array[i].replace(/^\s*/, "").replace(/\s*$/, "");
		}
		$.unique(channels_array);
		var channels_object_array = [];
		var pushBlog = true;
		for (var n = 0; n < channels_array.length; n++) {
			pushBlog = true;
			check: for (var j = 0; j < channels.length; j++) {
				if (formChannel == channels[j].name) {
					for (var k = 0; k < channels[j].blogs.length; k++) {
						if (channels[j].blogs[k].name == channels_array[n]){
							pushBlog = false;
							break check;
						}
					}			
					break;
				}
			}
			if (pushBlog){
				channels_object_array.push({
					name: channels_array[n],
					key: ""
				});
			} else {
				console.log(channels_array[n] + " ALREADY IN CHANNEL");
			}
			
		}
		$('#torcado_controlPanelChannelAddFormInput').val('');
		XKit.extensions.torcado_channels.addBlogToChannel(channels_object_array, formChannel);
	},
	
	filter_posts: function () {
		var posts = XKit.interface.get_posts("quick-tags-not-done", false);
		$("li.post_container").not("#new_post_buttons, #new_post, .torcado_checked").has("div").each(function () {
			var postBody = $(this).children(".post");
			var checkBlog = XKit.extensions.torcado_channels.active_channels_containing_blog({
				name: $(postBody).attr("data-tumblelog-name"),
				key: $(postBody).attr("data-tumblelog-key")
			});
			$(this).not(".torcado_checked").each(function () {
				$(this).addClass("torcado_checked");
			});
			if (!(checkBlog == false)) {
				if (settings["colorPosts"]) {
					$(postBody).css({
						"background": checkBlog[0].color
					});
					$(".post_content", postBody).css({
						"background": checkBlog[0].color
					});
				} else {
					$(postBody).css({
						"background": "#FFF"
					});
					$(".post_content", postBody).css({
						"background": "#FFF"
					});
				}
			} else {
				if (settings["filterPosts"]) {
					if(XKit.extensions.torcado_channels.preferences.remove.value){
						$(this).remove();
					} else {
						$(this).hide();
						$(this).addClass("torcado_hidden");
					}
				} else {
					$(postBody).css({
						"background": "#FFF"
					});
					$(".post_content", postBody).css({
						"background": "#FFF"
					});
				}
			}
			//----Maybe run this only AFTER for sure visible on dash
			if ($(this).children(":first").children(".torcado_addUserWrapper").length == 0) {
				$(this).children(":first").append("<div class=\"torcado_addUserWrapper\"><div class=\"torcado_addUserButton\"><div class=\"torcado_addUserButtonIconBefore\"></div><div class=\"torcado_addUserButtonIconAfter\"></div></div><div class=\"torcado_addUserChannels\"><span class=\"torcado_addUserChannelsSpan\"></span></div></div>");
				$(this).find(".torcado_addUserChannelsSpan").append(XKit.extensions.torcado_channels.addChannelHTML);
			}
			/*
			if ($(this).find('.torcado_addUserWrapper').length) {
				XKit.extensions.torcado_channels.getChannelButtons();
			}
			*/
		});
		$(".torcado_updatePending").each(function () {
			if ($(this).children().length > 0) {
				$(this).removeClass("torcado_updatePending");
				var postBody = ($(this).children(".post"));
				var checkBlog = XKit.extensions.torcado_channels.active_channels_containing_blog({
					name: $(postBody).attr("data-tumblelog-name"),
					key: $(postBody).attr("data-tumblelog-key")
				});
				if (!(checkBlog == false)) {
					if (settings["colorPosts"]) {
						$(postBody).css({
							"background": checkBlog[0].color
						});
						$(".post_content", postBody).css({
							"background": checkBlog[0].color
						});
					} else {
						$(postBody).css({
							"background": "#FFF"
						});
						$(".post_content", postBody).css({
							"background": "#FFF"
						});
					}
				} else {
					$(postBody).css({
						"background": "#FFF"
					});
					$(".post_content", postBody).css({
						"background": "#FFF"
					});
				}
			}
		});
	},
	
	filter_waiting_posts: function () {
		$(".torcado_postWaiting").each(function () {
			var postBody = $(this).children(".post");
			var checkBlog = XKit.extensions.torcado_channels.active_channels_containing_blog({
				name: $(postBody).attr("data-tumblelog-name"),
				key: $(postBody).attr("data-tumblelog-key")
			});
			$(this).not(".torcado_checked").each(function () {
				$(this).addClass("torcado_checked");
			});
			if (!(checkBlog == false)) {
				if (settings["colorPosts"]) {
					$(postBody).css({
						"background": checkBlog[0].color
					});
					$(".post_content", postBody).css({
						"background": checkBlog[0].color
					});
				} else {
					$(postBody).css({
						"background": "#FFF"
					});
					$(".post_content", postBody).css({
						"background": "#FFF"
					});
				}
			} else {
				if (settings["filterPosts"]) {
					if(XKit.extensions.torcado_channels.preferences.remove.value){
						$(this).remove();
					} else {
						$(this).hide();
						$(this).addClass("torcado_hidden");
					}
				} else {
					$(postBody).css({
						"background": "#FFF"
					});
					$(".post_content", postBody).css({
						"background": "#FFF"
					});
				}
			}
			if ($(this).children(":first").children(".torcado_addUserWrapper").length == 0) {
				$(this).children(":first").append("<div class=\"torcado_addUserWrapper\"><div class=\"torcado_addUserButton\"><div class=\"torcado_addUserButtonIconBefore\"></div><div class=\"torcado_addUserButtonIconAfter\"></div></div><div class=\"torcado_addUserChannels\"><span class=\"torcado_addUserChannelsSpan\"></span></div></div>");
				$(this).find(".torcado_addUserChannelsSpan").append(XKit.extensions.torcado_channels.addChannelHTML);
			}
			/*
			if ($(this).find('.torcado_addUserWrapper').length) {
				XKit.extensions.torcado_channels.getChannelButtons();
			}
			*/
		});
		if ($("#posts").find(".torcado_postWaiting").length >= XKit.extensions.torcado_channels.preferences.postsPerPage.value) {
			consecutive_load_count = 0;
			$(".torcado_postWaiting").each(function () {
				$(this).removeClass("torcado_postWaiting");
				$(this).show();
			});
		} else {
			consecutive_load_count++;
			if ((consecutive_load_count % 2) == 0) {
				window.scrollBy(0, -1);
				setTimeout(function () {
					window.scrollBy(0, 1);
				}, 300);
			}
		};
		$(".torcado_recommendedWaiting").each(function () {
			$(this).removeClass("torcado_recommendedWaiting");
			$(".blog-card-container", this).each(function () {
				$(this).find(".navigation").append("<div class=\"torcado_blogPreviewAddButtonWrapper\"><div class=\"torcado_blogPreviewAddButton\"><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonBar\"></div><div class=\"torcado_blogPreviewAddButtonPlusWrapper\"><div class=\"torcado_blogPreviewAddButtonPlusIcon\"></div></div></div><div class=\"torcado_blogPreviewAddUserChannels\"><span class=\"torcado_blogPreviewAddUserChannelsSpan\"></span></div></div>");
				$(this).find(".torcado_blogPreviewAddUserChannelsSpan").append(XKit.extensions.torcado_channels.addChannelHTML);
			});
		});
	},
	
	update_posts: function (blog) {
		$("li.post_container").not("#new_post_buttons, #new_post").each(function () {
			var postBody = ($(this).children(".post"));
			if (blog == "") {
				var checkBlog = XKit.extensions.torcado_channels.active_channels_containing_blog({
					name: $(postBody).attr("data-tumblelog-name"),
					key: $(postBody).attr("data-tumblelog-key")
				});
				$(this).not(".torcado_checked").each(function () {
					$(this).addClass("torcado_checked");
				});
				if (postBody.length == 0) {
					$(this).addClass("torcado_updatePending");
				}
				if (!(checkBlog == false)) {
					if (settings["colorPosts"]) {
						$(postBody).css({
							"background": checkBlog[0].color
						});
						$(".post_content", postBody).css({
							"background": checkBlog[0].color
						});
					} else {
						$(postBody).css({
							"background": "#FFF"
						});
						$(".post_content", postBody).css({
							"background": "#FFF"
						});
					}
				} else {
					$(postBody).css({
						"background": "#FFF"
					});
					$(".post_content", postBody).css({
						"background": "#FFF"
					});
				}
			} else {
				if ($(postBody).attr("data-tumblelog-name") == blog) {
					var checkBlog = XKit.extensions.torcado_channels.active_channels_containing_blog({
						name: $(postBody).attr("data-tumblelog-name"),
						key: $(postBody).attr("data-tumblelog-key")
					});
					$(this).not(".torcado_checked").each(function () {
						$(this).addClass("torcado_checked");
					});
					if (!(checkBlog == false)) {
						if (settings["colorPosts"]) {
							$(postBody).css({
								"background": checkBlog[0].color
							});
							$(".post_content", postBody).css({
								"background": checkBlog[0].color
							});
						} else {
							$(postBody).css({
								"background": "#FFF"
							});
							$(".post_content", postBody).css({
								"background": "#FFF"
							});
						}
					} else {
						$(postBody).css({
							"background": "#FFF"
						});
						$(".post_content", postBody).css({
							"background": "#FFF"
						});
					}
				}
			}
		});
	},
	
	active_channels_containing_blog: function (blog) {
		var inActiveChannels = [];
		if (blog.key != "") {
			check: for (var n = 0; n < channels.length; n++) {
				for (var i = 0; i < channels[n].blogs.length; i++) {
					if (channels[n].blogs[i].key == blog.key) {
						if (channels[n].isOn == true) {
							inActiveChannels.push(channels[n]);
							if (channels[n].blogs[i].name != blog.name) {
								channels[n].blogs[i].name = blog.name;
								console.log("OUTDATED TUMBLELOG-NAME, UPDATED");
							}
						}
					} else if (channels[n].blogs[i].name == blog.name) {
						if (channels[n].isOn == true) {
							inActiveChannels.push(channels[n]);
						}
						XKit.extensions.torcado_channels.get_key_for_name(channels[n].blogs[i]);
						console.log("NO TUMBLELOG-KEY, UPDATE PUSHED");
					}
				}
			}
		} 
		console.log(inActiveChannels)
		if (inActiveChannels.length == 0) {
			console.log(inActiveChannels)
			return false;
		} else {
			console.log(inActiveChannels)
			return inActiveChannels;
		}
	},
	
	channels_containing_blog: function (blog) {
		var inChannels = [];
		if (blog.key != "") {
			check: for (var n = 0; n < channels.length; n++) {
				for (var i = 0; i < channels[n].blogs.length; i++) {
					if (channels[n].blogs[i].key == blog.key) {
						inChannels.push(channels[n]);
						if (channels[n].blogs[i].name != blog.name) {
							channels[n].blogs[i].name = blog.name;
							console.log("OUTDATED TUMBLELOG-NAME, UPDATED");
						}
					} else if (channels[n].blogs[i].name == blog.name) {
						XKit.extensions.torcado_channels.get_key_for_name(channels[n].blogs[i]);
						inChannels.push(channels[n]);
					}
				}
			}
		}
		console.log(inChannels)
		if (inChannels.length == 0) {
			console.log(false)
			return false;
		} else {
			console.log(inChannels)
			return inChannels;
		}
	},
	
	channels_containing_blog_name: function(blogName){
		var inChannels = [];
		check: for (var n = 0; n < channels.length; n++) {
				for (var i = 0; i < channels[n].blogs.length; i++) {
					if (channels[n].blogs[i].name == blogName) {
						inChannels.push(channels[n]);
					}
				}
			}
		if (inChannels.length == 0) {
			return false;
		} else {
			return inChannels;
		}
	},
	
	get_key_for_name: function (blogObj) {
		$("li.post_container").not("#new_post_buttons, #new_post").each(function () {
			var postBody = ($(this).children(".post"));
			if (postBody.attr("data-tumblelog-name") == blogObj.name) {
				blogObj.key = postBody.attr("data-tumblelog-key");
				return true;
			}
		});
	},
	
	buttonCheckChannel: function (buttonName, inChannels) {
		for (var i = 0; i < inChannels.length; i++) {
			if (buttonName == inChannels[i].name) {
				return true;
			}
		}
		return false;
	},
	
	buttonCheckChannelState: function (channelName) {
		for (var i = 0; i < channels.length; i++) {
			if (channelName == channels[i].name) {
				return channels[i].isOn;
			}
		}
		return false;
	},
	
	destroy: function () {
		this.running = false;
		$("#torcado_controlPanel").remove();
		$("#torcado_dashLengthen").remove();
		$(".torcado_addUserWrapper").remove();
		$("#torcado_tempHolder").remove();
		$("#torcado_controlPanelChannelAddInputWrapper").remove();
		$("#torcado_channelSettingsWrapper").remove();
		$("#torcado_newChannelWrapper").remove();
		XKit.tools.remove_css("torcado_channels");
	},
	
	//TOOLS
	rgbToHex: function (rgb) {
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		function hex(x) {
			return ("0" + parseInt(x).toString(16)).slice(-2);
		}
		return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
	},
	
	
	HueToRgb: function (m1, m2, hue) {
		hue < 0 ? hue += 1 : 
		hue > 1 ? hue -= 1:
		false;
		var v = 6 * hue < 1 ? m1 + (m2 - m1) * hue * 6 :
				2 * hue < 1 ? m2 :
				3 * hue < 2 ? m1 + (m2 - m1) * (2/3 - hue) * 6 :
				m1;
		return 255 * v;
	},
	
	hslToHex: function (h, s, l){
		var rgb,r,g,b,m1, m2, hue;
		s /=100;
		l /= 100;
		if (s == 0) r = g = b = (l * 255);
		else {
		m2 = l <= 0.5 ? l * (s + 1):
		l + s - l * s;
		m1 = l * 2 - m2;
		hue = h / 360;
		r = XKit.extensions.torcado_channels.HueToRgb(m1, m2, hue + 1/3);
		g = XKit.extensions.torcado_channels.HueToRgb(m1, m2, hue);
		b = XKit.extensions.torcado_channels.HueToRgb(m1, m2, hue - 1/3);
		}
	  rgb = b | (g << 8) | (r << 16);
	  return rgb.toString(16);
	},
	
	eventFire: function (el, etype){
		if (el.fireEvent) {
			el.fireEvent('on' + etype);
		} else {
			var evObj = document.createEvent('Events');
			evObj.initEvent(etype, true, false);
			el.dispatchEvent(evObj);
		}
	}
});
