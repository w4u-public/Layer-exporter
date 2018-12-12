#target photoshop

// Layer Expoter ver.1.0b
// Github: https://github.com/w4u-public/Layer-exporter
// Lisence: MIT

(function() {

	//===================
	// パネル 初期設定
	//===================

	var $outputFolder = "~/Desktop/EXPORT_PSD"; //初期の保存場所
	var $searchArea = 0; // 0:すべて 1:選択レイヤー 2:スプライトのみ
	var $searchChilds = false; // 「*」 内部も検索するか
	var $renameLayer = false; // 書き出し後に*などのキーワードをレイヤー名から削除
	var $zeroPaddingDigit = 2;　// 「*>」 内、書き出しファイル名の桁数　ex. 2 = 01, 02...10
	var $childNumAscend = true; //  「*>」 内、ナンバリング (true:昇順 / false:降順)
	var $skipInvChild = false; // 「*>」 内、不可視レイヤーをスキップ
	var $exportSpriteMap = true; // スプライト作成時に図面も書き出す
	var $quality = { //Web用書き出し画像の品質　0 ~ 100 (100以上で通常保存の最高品質)
		jpg: 80
	};
	var $tinyPlugin = false; // TinyPNG plugin をインストールしている場合は使用できる

	//================
	// Polyfill
	//================

	if (!Array.prototype.forEach) {
	  Array.prototype.forEach = function(callback, thisArg) {
	    var T, k;
	    if (this == null) {
	      throw new TypeError(" this is null or not defined");
	    }
	    var O = Object(this);
	    var len = O.length >>> 0;
	    if ({}.toString.call(callback) != "[object Function]") {
	      throw new TypeError(callback + " is not a function");
	    }
	    if (thisArg) {
	      T = thisArg;
	    }
	    k = 0;
	    while(k < len) {
	      var kValue;
	      if (k in O) {
	        kValue = O[ k ];
	        callback.call(T, kValue, k, O);
	      }
	      k++;
	    }
	  };
	}

	var $quickExport = false;
	var snapshot = (function() {
		var id = 0;
		return {
			take: function(type) {
				var desc0 = new ActionDescriptor();
				var ref0 = new ActionReference();
				ref0.putClass(charIDToTypeID("SnpS"));
				desc0.putReference(charIDToTypeID("null"), ref0);
				var ref1 = new ActionReference();
				ref1.putProperty(charIDToTypeID("HstS"), charIDToTypeID("CrnH"));
				desc0.putReference(charIDToTypeID("From"), ref1);
				executeAction(charIDToTypeID("Mk  "), desc0, DialogModes.NO);
				if(type == 'sprite') return;
				id = getSnapshotNum();
			},
			restore: function() {
				activeDocument.activeHistoryState = activeDocument.historyStates[id];
			}
		}

		function getSnapshotNum() {
			var history = activeDocument.historyStates;
			for(var i = history.length-1; i > -1; i--) {
				if(history[i].snapshot) return i;
			}
		}
	})();

	var spriteHolder = (function() {
		var spriteList = [];
		var pairSpritesList = [];
		var reg = /^\*\{([a-zA-Z]|\d+)([\d])?\}/;
		return {
			add: {
				sprite: function(layer) {
					spriteList.push({
						layer: layer,
						key: parseInt(layer.name.match(reg)[1], 10)
					});
				},
				pairSprites: function(layer) {
					var spriteName = layer.name.match(reg);
					var num =  (spriteName[2] || 0);
					var obj = {};
					obj.layer = layer;
					obj.key = spriteName[1];
					if(pairSpritesList[num] == undefined) {
						pairSpritesList[num] = [];
					}
					pairSpritesList[num].push(obj);
				}
			},
			get: {
				spriteList: function() {
					return sortSpriteList(spriteList);
				},
				pairSpriteList: function() {
					return sortPairSpriteLists(pairSpritesList);
				}
			}
		}

		function sortSpriteList(array) {
			return 	array.sort(function(a, b) {
				var a = a["key"];
				var b = b["key"];
				if(a < b) return -1;
				if(a > b) return 1;
				return 0;	
			})
		}

		function sortPairSpriteLists(array) {
			var sortArray = [];
			for(var i = 0, l = array.length; i < l; i++) {
				var sprite = array[i];
				if(!sprite) continue;
				sprite.sort(function(a, b) {
					var a = a["key"];
					var b = b["key"];
					if(a < b) return -1;
					if(a > b) return 1;
					return 0;
				})
				sortArray.push(sprite);
			}
			return sortArray;
		}
	})();

	var isTargetLayer = function(layer) {
		return /^\*/.test(layer.name);
	}

	var isSpriteLayer = function(layer) {
		return /^\*\{\d+\}/.test(layer.name);
	}

	var isPairSpriteLayer = function(layer) {
		return /^\*\{([a-zA-Z])([\d])?\}/.test(layer.name);
	}

	var isTargetChilds = function(layer) {
		if(layer.typename !== 'LayerSet') return false;
		return /^\*\s*(\>|\/)/.test(layer.name);
	}

	var isNameOfParent = function(layer){
		return /^\*\s*\>/.test(layer.name);
	}

	var isCheckChilds = function(layer) {
		if(layer.typename !== 'LayerSet') return false;
		if(isTargetLayer(layer) && !$searchChilds) return false;
		return true;
	}

	var rgb = function(r, g, b) {
		var rgb = new SolidColor();
		rgb.rgb.red = r;
		rgb.rgb.green = g;
		rgb.rgb.blue = b;
		rgb.rgb.model = ColorModel.RGB; 
		return rgb;
	}

	var zeroPadding = function(num, digit) {
		var str = num.toString();
		for(var i = 0, c = digit - str.length; i < c; i++) {
			str = '0' + str;
		}
		return str;
	}

	var trimCanvas = function() {
		activeDocument.trim(TrimType.TRANSPARENT, true, true, true, true);
	}

	var mergeLayer = function(layer) {
		if(activeDocument.layers.length == 1) {
			if(activeDocument.layers[0].typename == 'LayerSet') {
				var idMrgtwo = charIDToTypeID("Mrg2");
				executeAction(idMrgtwo, undefined, DialogModes.NO);
			} else {
				activeDocument.artLayers.add();
				activeDocument.mergeVisibleLayers();
			}
		} else {
			activeDocument.activeLayer = layer;
			activeDocument.mergeVisibleLayers();
		}
		return activeDocument.activeLayer;
	}

	var showOnlyLayer = function(showLayerArray) {
		for(var i = 0, l = activeDocument.layers.length; i < l; i++) {
			activeDocument.layers[i].visible = false;
		}
		if(!showLayerArray) return;
		showLayerArray.forEach(function(e) {
			e.visible = true;
			visibleParentLayer(e);
		});
	}

	function visibleParentLayer(layer) {
		if(layer.parent.typename == 'Document') return;
		layer.parent.visible = true;
		for(var i = 0, l = layer.parent.layers.length; i < l; i++) {
			var childLayer = layer.parent.layers[i];
			if(childLayer !== layer) {
				childLayer.visible = false;
			}
		}
		visibleParentLayer(layer.parent);
	}

	var normarizeName = function(str) {
		var _str = str.replace(/^\*(\>)?(\{([a-zA-Z])([\d])?\})?/, '');
		_str = _str.replace(/(\.jpg|\.jpeg|\.png|\.psd)(\(\d+\))?/,'');
		_str = _str.replace(/(\(\d+(%|w|h)\))/ig, '');
		if(_str == '') _str = '_NONAME';
		return _str;
	}

	var createFolder = function(name) {
		var path = (name !== undefined) ? $outputFolder + "/" + normarizeName(name) : $outputFolder;
		var folderObj = new Folder(path);
		folderObj.create();
		return path;
	}

	var selectedStartLayer = function(root, callback) {
		callback(root);
		if(!root.layers || isTargetChilds(root)) return; 
		followLayers(root, callback);
	}

	var followLayers = function(root, callback) {
		for(var i = 0, l = root.layers.length; i < l; i++) {
			var layer = root.layers[i];
			if(isCheckChilds(layer)) followLayers(layer, callback);
			callback(layer);
		}
	}

	var quickExport = function(layer) {
		switch($quickExport) {
			case 'normal':
				exportLayer(layer);
				break;
			case 'parentName':
				if(layer.typename !== 'LayerSet') {
					alert("グループが選択されていません。");
					return false;
				}
				exportChildLayer(layer);
				break;
			case 'childName':
				if(layer.typename !== 'LayerSet') {
					alert("グループが選択されていません。");
					return false;
				}
				exportChildLayer(layer);
				break;
		}
	}

	var correctLayerName = function(layer) {
		if(!isTargetLayer(layer.name)) return;
		layer.name = normarizeName(layer.name);
	}

	var screeningLayer = function(layer) {
		if(!isTargetLayer(layer)) return;
		if(isSpriteLayer(layer)) {
			spriteHolder.add.sprite(layer);
			return;
		}
		if(isPairSpriteLayer(layer)) {
			spriteHolder.add.pairSprites(layer);
			return;
		}
		if($searchArea == 2) return;
		if(isTargetChilds(layer)) {
			exportChildLayer(layer);
		} else {
			exportLayer(layer);
		}
	}

	var exportLayer = function(layer, name, path) {
		var targetLayer = new ExportTargetLayer(layer, name, path);
		targetLayer.export();
	}

	var exportChildLayer = function(layer) {
		var offset = 0;
		var parentLayer = layer;
		var childLayers = layer.layers;
		for(var i = 0, l = childLayers.length, n = 1; i < l; i++, n++) {
			var name;
			var childLayer = layer.layers[i];
			if($skipInvChild && !childLayer.visible) {
				n--;
				continue;
			};
			if(isTargetChilds(childLayer)) {
				exportChildLayer(childLayer)
				continue;
			}
			if(isTargetLayer(childLayer)) {
				name = childLayer.name;
				n--;
			} else {
				if(isNameOfParent(parentLayer) || $quickExport == 'parentName') {
					$childNumAscend ? offset = n : offset = (l + 1) - n;
					name = parentLayer.name + zeroPadding(offset, $zeroPaddingDigit);
				} else {
					name = childLayer.name;
				}
			}
			exportLayer(childLayer, name);
		}
	}

	var getBounds = function(layer) {
		var bounds = {};
		var b = layer.bounds;
		bounds.x = parseInt(b[0], 10);
		bounds.y = parseInt(b[1], 10);
		bounds.w = parseInt(b[2] - b[0], 10);
		bounds.h = parseInt(b[3] - b[1], 10);
		bounds.rect = [
			[bounds.x, bounds.y],
			[bounds.x + bounds.w, bounds.y],
			[bounds.x + bounds.w, bounds.y + bounds.h],
			[bounds.x, bounds.y + bounds.h]
		]
		return bounds;
	}

	var openSettingDialog = function() {
		var ready;
		var w, column1, column2, searchArea, qualityComment, radioGroup, options, isSearchChilds, sprite, spriteMap, rename, quick, quality, imgQuality, jpgQuality, pngQuality, tinyPlugin, exportPath, exportChilds, digit, order, skipInv;
		var selectNormalExport, selectParentNameExport, selectChildNameExport;
		var w = new Window('dialog', 'Export settings');
		w.main = w.add("group");
		w.main.orientation = "row";

		// COLUMN1
		column1 = w.main.column1 = w.main.add('group');
		column1.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
		column1.orientation = "column";

			// Search area
			searchArea = column1.add("panel", undefined, "・SEARCH EXPORT");
			searchArea.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
			searchArea.orientation = "column";
			searchArea.alignChildren = "left";

				// Radio button
				radioGroup = searchArea.add("group");
				radioGroup.orientation = "column";
				radioGroup.alignChildren = "left";
				radioGroup.margins.top = 8;
				radioGroup.all = radioGroup.add("radiobutton", undefined, "すべての「*」を検索");
				radioGroup.selected = radioGroup.add("radiobutton", undefined, "選択中のレイヤー範囲");
				radioGroup.sprite = radioGroup.add("radiobutton", undefined, "スプライトのみ");

				// Separator
				options = searchArea.add("panel");
				options.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
				options.orientation = "column";
				options.alignChildren = "left";

				// Search childs
				isSearchChilds = searchArea.add("group");
				isSearchChilds.orientation = "column";
				isSearchChilds.alignChildren = "left";
				isSearchChilds = isSearchChilds.add("checkbox", undefined, "*のレイヤー内部も検索");
				isSearchChilds.value = $searchChilds;

				switch($searchArea) {
					case 0:
						radioGroup.all.value = true;
						break;
					case 1:
						radioGroup.selected.value = true;
						break;
					case 2:
						radioGroup.sprite.value = true;
						break;
					default:
				}

				// Rename
				rename = searchArea.add("group");
				rename.orientation = "column";
				rename.alignChildren = "left";
				rename = rename.add("checkbox", undefined, "書出し後にレイヤー名を修正");
				rename.value = $renameLayer;

				// Quick Export
				quick = column1.add("panel", undefined, "・QUICK EXPORT");
				quick.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
				quickGroup1 = quick.add("group");
				quickGroup1.orientation = "column";
				quickGroup1.alignChildren = "left";
				quickGroup1.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
				quickGroup1.margins.top = 8;
				quickGroup1.title = quickGroup1.add("statictext", undefined, "選択中のレイヤーを書き出し実行");

					selectNormalExport = quickGroup1.add("button", undefined, "書き出し");
					selectNormalExport.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
					selectParentNameExport = quickGroup1.add("button", undefined, "グループ内を親名前連番　(*>)");
					selectParentNameExport.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
					selectChildNameExport = quickGroup1.add("button", undefined, "グループ内を子名前　(*/)");
					selectChildNameExport.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];

					// EVENT
					selectNormalExport.addEventListener('mousedown', function() {
						$quickExport = 'normal';
						ready = setDefaultSettings(true);
						w.close();
					});

					selectParentNameExport.addEventListener('mousedown', function() {
						$quickExport = 'parentName';
						ready = setDefaultSettings(true);
						w.close();
					});

					selectChildNameExport.addEventListener('mousedown', function() {
						$quickExport = 'childName';
						ready = setDefaultSettings(true);
						w.close();
					})


		// COLUMN2
		column2 = w.main.column2 = w.main.add('group');
		column2.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
		column2.orientation = "column";

			//exportChilds
			exportChilds = column2.add("panel", undefined, "・CHILD LAYERS");
			exportChilds.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
			exportChilds.orientation = "column";
			exportChilds.alignChildren = "left";

				// Digit
				digit = exportChilds.add("group");
				digit.margins.top = 6;
				digit.title = digit.add("statictext", undefined, "ファイル名の桁数:");
				digit.edittext = digit.add('edittext {preferredSize: [1, 1], properties: {multiline: false}}');
				digit.edittext.text = $zeroPaddingDigit;

					// EVENT
					digit.edittext.addEventListener("keyup", function() {
						$zeroPaddingDigit = digit.edittext.text;
					});

				// Oder
				order = exportChilds.add("group");
				order.ascend = order.add("radiobutton", undefined, "昇順");
				order.descend = order.add("radiobutton", undefined, "降順");
				if($childNumAscend) {
					order.ascend.value = true;
				} else {
					order.descend.value = true;
				}

				// Skip Invisible
				skipInv = exportChilds.add("checkbox", undefined, '不可視レイヤーは無視');
				skipInv.value = $skipInvChild;

			// Sprite
			sprite = column2.add("panel", undefined, "・ SPRITE");
			sprite.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
			sprite.orientation = "column";
			sprite.alignChildren = "left";
			spriteMap = sprite.add("checkbox", undefined, "スプライトマップを書き出し");
			spriteMap.value = $exportSpriteMap;

			// Quality
			quality = column2.add("panel", undefined, "・QUALITY");
			quality.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
			quality.alignChildren = "left";
			quality.orientation = "column";

				imgQuality = quality.add("group");

				// jpg
				jpgQuality = imgQuality.add("group");
				jpgQuality.alignChildren = "left";
				jpgQuality.margins.top = 8;
				jpgQuality.title = jpgQuality.add("statictext", undefined, "JPG:");
				jpgQuality.edittext = jpgQuality.add('edittext {preferredSize: [2, 1], properties: {multiline: false}}');
				jpgQuality.edittext.text = $quality.jpg;

				// png
				// pngQuality = imgQuality.add("group");
				// pngQuality.margins.top = 8;
				// pngQuality.alignChildren = "left";
				// pngQuality.title = pngQuality.add("statictext", undefined, "PNG:");
				// pngQuality.edittext = pngQuality.add('edittext {preferredSize: [2, 1], properties: {multiline: false}}');
				// pngQuality.edittext.text = $quality.png;

				// Comment
				qualityComment = quality.add("group");
				qualityComment.title = qualityComment.add("statictext", undefined, "*100以上で高画質通常保存");

				// Tiny plugin
				tinyPlugin = quality.add('checkbox', undefined, 'Tiny Plugin で書き出す');
				tinyPlugin.value = $tinyPlugin;
				if($tinyPlugin) {
					imgQuality.enabled = false;
					qualityComment.enabled = false;
				} else {
					imgQuality.show();
					qualityComment.show();
				}

					// Event
					tinyPlugin.addEventListener("mousedown", function() {
						if(!tinyPlugin.value) {
							imgQuality.enabled = false;
							qualityComment.enabled = false;
						} else {
							imgQuality.enabled = true;
							qualityComment.enabled = true;
						}
					})

		// COLUMN3

		// Export Path
		exportPath = w.add("panel");
		exportPath.alignment = [ScriptUI.Alignment.FILL, ScriptUI.Alignment.TOP];
		exportPath.alignChildren = "left";
		exportPath.orientation = "row";
		exportPath.button = exportPath.add("button", undefined, "保存先");
		exportPath.pathText = exportPath.add("statictext", ["","",240, 20], $outputFolder);

		// EVENT
		exportPath.button.addEventListener("click", function() {
			var path = Folder.selectDialog("保存先フォルダの選択");
			if(path) exportPath.pathText.text = $outputFolder = decodeURI(path);
		});

		// Action
		w.action = w.add("group");
		w.action.btnNg = w.action.add("button", undefined, "キャンセル", {name: "cancel"});
		w.action.btnOk = w.action.add("button", undefined, "実行", {name: "ok"});

		w.action.btnOk.addEventListener("mousedown", function() {
			ready = setDefaultSettings();
			w.close();
		});

		w.action.btnNg.addEventListener("mousedown", function() {
			w.close();
		});

		w.show();

		return ready;

		function setDefaultSettings(quick) {
			$searchChilds = isSearchChilds.value;
			// $quality.png = pngQuality.edittext.text;
			$quality.jpg = jpgQuality.edittext.text;
			$isRenameLayer = rename.value;
			$searchArea = getSearchArea();
			$childNumAscend = order.ascend.value;
			$exportSpriteMap = spriteMap.value;
			$tinyPlugin = tinyPlugin.value;
			$skipInvChild = skipInv.value;
			if(quick) {
				$searchArea = false;
				$exportSpriteMap = false;
				$skipInvChild = false;
			}
			return true;
		}

		function getSearchArea() {
			if(radioGroup.all.value) {
				return 0;
			} else if(radioGroup.selected.value) {
				return 1;
			} else if(radioGroup.sprite.value) {
				return 2;
			}
		}
	}

	var createSprites = function() {
		var spriteLists = spriteHolder.get.spriteList();
		var rootDoc = activeDocument;
		var spriteDoc, rootLayer;
		var map = canvasMap();
		for(var i = 0, l = spriteLists.length; i < l; i++) {
			var sprite = new SpriteLayer(spriteLists[i]);
			if(i == 0) {
				rootLayer = sprite.layer;
				spriteDoc = createSpriteDoc(sprite);
				map.updateCanvasSize();
				continue;
			}
			addSprite(sprite);
			var a = map.get.data();
		}

		function resizeCanvas(nextSprite) {
			var mapData = map.get.data();
			var nBounds = getBounds(nextSprite.layer);
			if(sprite.sameSize(nextSprite)) {
				activeDocument.resizeCanvas(
					mapData.canvas.w + nBounds.w,
					mapData.canvas.h, AnchorPosition.TOPLEFT);
			}
			return;
		}

		function addSprite(sprite, rootDoc, spriteDoc) {
			sprite.copyLayer(rootDoc);
			sprite.pasteLayer(spriteDoc);
			sprite.used(true);

			function translate() {
				var bounds = resetPos();
				var lastPos = map.get.lastPos();
				sprite.layer.translate(lastPos.x, lastPos.y);
				return bounds;

				function resetPos() {
					var bounds = getBounds(sprite.layer);
					sprite.layer.translate(-bounds.x, -bounds.y);
					return getBounds(sprite.layer);
				}
			}
		}

		function createSpriteDoc(sprite) {
			sprite.convertSmartObj();
			var newDoc = sprite.openSmartObj();
			sprite.layer = mergeLayer();
			trimCanvas();
			var bounds = getBounds(sprite.layer);
			map.addEndPos({
				x: bounds.x + bounds.w,
				y: bounds.y + bounds.h
			});
			sprite.used(true);
			return newDoc;
		}

		function canvasMap() {
			var data = {
				canvas: {
					w: 0,
					h: 0
				},
				pos: [],
			};
			return {
				updateCanvasSize: function() {
					data.canvas.w = parseInt(activeDocument.width);
					data.canvas.h = parseInt(activeDocument.height);
				},
				addEndPos: function(endXY) {
					data.pos.push(endXY);
				},
				clearLastPos: function() {
					data.pos.pop();
				},
				get: {
					data: function() {
						return data;
					},
					canvasSize: function() {
						return data.canvas;
					},
					pos: function() {
						return data.pos[data.pos.length - 1];
					},
					ratio: function() {
						return data.canvas.w / data.canvas.h;
					}
				}
			}
		}
	}

	var createPairSprites = function() {
		var pairSpriteList = spriteHolder.get.pairSpriteList();
		pairSpriteList.forEach(function(e) {
			followSpriteGroup(e);
		});
		
		function followSpriteGroup(spriteGroup) {
			var rootLayer, spriteDoc;
			var rootDoc = activeDocument;
			var sprites = [];
			var len = spriteGroup.length;
			var canvasSize = {};
			if((len % 2) != 0) {
				alert('スプライトの指定が正しく対になっていないようです。\n例: \*[a]と\*[A]\, *[b]と\*[B]のようにしてください。\n\nスプライトの書き出しはスキップしました。');
				return;
			}
			for(var i = 0; i < len; i++) {
				var sprite = spriteGroup[i];
				if(sprite.key == sprite.key.toUpperCase()) continue;
				var baseSprite = new SpriteLayer(sprite);
				var hoverSprite = baseSprite.getPairSpriteLayer(spriteGroup);
				if(!rootLayer) rootLayer = baseSprite;
				baseSprite.copyLayer(rootDoc);
				if(!spriteDoc) {
					spriteDoc = baseSprite.openSmartObj();
					baseSprite.layer = mergeLayer();
					trimCanvas();
				} else {
					baseSprite.pasteLayer(spriteDoc);
				}
				hoverSprite.copyLayer(rootDoc);
				hoverSprite.pasteLayer(spriteDoc);
				canvasSize = resizeCanvas();
				baseSprite.moveSpriteTop(canvasSize);
				hoverSprite.moveSpriteBottom(canvasSize);
				sprites.push([baseSprite, hoverSprite]);
			}
			alignBottoms(canvasSize, sprites);
			adjustPairSpritePosition(sprites);
			if($exportSpriteMap) createSpriteMap(rootLayer, sprites);
			rootLayer.export();

			function adjustPairSpritePosition(sprites) {
				sprites.forEach(function(spriteSet) {
					spriteSet.forEach(function(sprite, i) {
						var pairNum = (i == 0) ? 1: 0;
						var spritePair = spriteSet[pairNum];
						if(sprite.bigger.W) {
							var offsetX = (sprite.bounds.w / 2) - (spritePair.bounds.w / 2);
							spritePair.layer.translate(offsetX, 0);
						}
						if(sprite.bigger.H) {
							var offsetY = (sprite.bounds.h / 2) - (spritePair.bounds.h / 2);
							if(pairNum == 1) offsetY *= -1;
							spritePair.layer.translate(0, offsetY);
						}
					});
				})
			}

			function resizeCanvas() {
				var w, h;
				var obj = {};
				var startX = canvasSize.endX || 0;
				baseSprite.bounds = getBounds(baseSprite.layer);
				hoverSprite.bounds = getBounds(hoverSprite.layer);
				if(baseSprite.bounds.w > hoverSprite.bounds.w) {
					baseSprite.bigger.W = true;
					w = baseSprite.bounds.w;
				} else {
					hoverSprite.bigger.W = true;
					w = hoverSprite.bounds.w;
				}
				if(baseSprite.bounds.h > hoverSprite.bounds.h) {
					baseSprite.bigger.H = true;
					h = baseSprite.bounds.h * 2;
				} else {
					hoverSprite.bigger.H = true;
					h = hoverSprite.bounds.h * 2;
				}
				if(canvasSize.h > h) h = canvasSize.h;
				activeDocument.resizeCanvas(w + startX, h, AnchorPosition.TOPLEFT);
				obj.w = parseInt(activeDocument.width);
				obj.h = parseInt(activeDocument.height);
				obj.endX = obj.w;
				obj.startX = startX;
				return obj;
			}

			function alignBottoms(canvasSize, sprites) {
				if(sprites.length <= 1) return;
				sprites.forEach(function(pairSprites) {
					for(var i = 0, len = pairSprites.length;  i < len; i++) {
						if(i == 0) continue;
						var spriteBottom = pairSprites[i];
						var y = canvasSize.h - (spriteBottom.bounds.y + spriteBottom.bounds.h);
						spriteBottom.layer.translate(0, y);
					}
				})
			}

			function createSpriteMap(rootLayer, sprites) {
				snapshot.take('sprite');
				var ratio = getZoomRatio();
				rootLayer.changeResolution(ratio);
				for(var i = 0, l = sprites.length; i < l; i++) {
					var spritePair = sprites[i];
					for(var j = 0, len = spritePair.length; j < len; j++) {
						var sprite = spritePair[j];
						var bounds = getBounds(sprite.layer);
						var boxSize = "[" + (bounds.w / ratio) + " x " + (bounds.h / ratio) + "]";
						if(i == 0 && j == 0) addSizeMaker(bounds, 0, 'first');
						if(sprite.bigger.W) biggerWSprite(sprites, bounds)
						if(sprite.bigger.H) biggerHSprite(sprites, bounds);
						addSizeMaker(bounds, boxSize);
					}
				}
				createSpriteTitle(rootLayer.settings.fileName);
				exportSpriteMap(rootLayer);
				activeDocument.activeHistoryState = activeDocument.historyStates[1];

				function exportSpriteMap(spriteBase) {
					spriteBase.createExportOptions();
					var fullPath = spriteBase.settings.path + "/" + "_SPRITE_MAP_" + spriteBase.settings.fileName + ".png";
					var saveFile = new File(fullPath);
					var options = new ExportOptionsSaveForWeb();
					options.format = SaveDocumentType.PNG;
					options.PNG8 = false;
					options.interlaced = false;
					options.optimized = true;
					createFolder();
					activeDocument.exportDocument(saveFile, ExportType.SAVEFORWEB, options);
				}

				function createSpriteTitle(name) {
					var titleH = 20;
					activeDocument.resizeCanvas(
						activeDocument.width.value, 
						activeDocument.height.value + titleH,
						AnchorPosition.TOPCENTER
					);
					activeDocument.selection.select([
						[0, activeDocument.height.value - titleH],
						[activeDocument.width.value, activeDocument.height.value - titleH],
						[activeDocument.width.value, activeDocument.height.value],
						[0, activeDocument.height.value]
					]);
					activeDocument.selection.fill(rgb(0, 70, 140), ColorBlendMode.NORMAL, 100, false);
					activeDocument.selection.select([
						[0, activeDocument.height.value - titleH],
						[activeDocument.width.value, activeDocument.height.value - titleH],
						[activeDocument.width.value, activeDocument.height.value - titleH + 1],
						[0, activeDocument.height.value - titleH + 1]
					]);
					activeDocument.selection.fill(rgb(0, 255, 255), ColorBlendMode.NORMAL, 100, false);
					var txtLayer = activeDocument.artLayers.add();
					txtLayer.kind = LayerKind.TEXT;
					txtLayer.textItem.contents = name + " - SPRITE MAP";
					var textSize = 10 / (activeDocument.resolution / 72);
					txtLayer.textItem.font = "Verdana";
					txtLayer.textItem.size = UnitValue(textSize + "px");
					txtLayer.textItem.color = rgb(0, 255, 255);
					txtLayer.textItem.position = [8, activeDocument.height.value - 6]
				}

				function biggerWSprite(sprites, bounds) {
					var globalX = bounds.rect[1][0] / ratio;
					if((sprites.length -1 !== i)) {
						var vLine = [
							[bounds.x + bounds.w, 0],
							[bounds.x + bounds.w + 1, 0],
							[bounds.x + bounds.w + 1, activeDocument.height.value],
							[bounds.x + bounds.w, activeDocument.height.value]
						]
						drawLine(vLine);
						addSizeMaker(bounds, globalX, 'globalX');
					}
				}

				function biggerHSprite(sprites, bounds) {
					var hLine, hLineBottom;
					if(j == 0) {
						hLine = [
							bounds.rect[3],
							bounds.rect[2],
							[bounds.x + bounds.w, bounds.h + 1],
							[bounds.x, bounds.h + 1]
						]
						drawLine(hLine);
						hLineBottom = [
							[bounds.x, activeDocument.height.value - (bounds.y + bounds.h)],
							[bounds.x + bounds.w, activeDocument.height.value - (bounds.y + bounds.h)],
							[bounds.x + bounds.w, activeDocument.height.value - (bounds.y + bounds.h) + 1],
							[bounds.x, activeDocument.height.value - (bounds.y + bounds.h) + 1]
						]
						drawLine(hLineBottom);
					} else {
						hLine = [
							bounds.rect[0],
							bounds.rect[1],
							[bounds.x + bounds.w, bounds.y + 1],
							[bounds.x, bounds.y + 1]
						]
						drawLine(hLine);
					}
				}
			}
		}
	}

	function getZoomRatio() {
		var ratio = 1;
		var size = parseInt(activeDocument.height) * parseInt(activeDocument.width);
		if(size <= 2000) {
			ratio = 10;
		} else if (size <= 4000) {
			ratio = 8;
		} else if (size <= 8000) {
			ratio = 6;
		} else if (size <= 16000) {
			ratio = 4;
		} else if (size <= 20000) {
			ratio = 2;
		};
		return ratio;
	}

	function drawLine(rectArray) {
		var lineLayer = activeDocument.artLayers.add();
		activeDocument.selection.select(rectArray);
		activeDocument.activeLayer = lineLayer;
		activeDocument.selection.fill(rgb(0, 255, 255), ColorBlendMode.NORMAL, 100, false);
		activeDocument.selection.deselect();
	}

	function addSizeMaker(bounds, text, type) {
		var txtLayerBounds, textPosArray, txtColor, bgColor, h;
		var bgLayer = activeDocument.artLayers.add();
		var txtLayer = activeDocument.artLayers.add();
		var textSize = 10;
		txtLayer.kind = LayerKind.TEXT;
		txtLayer.textItem.contents = text;
		textSize = textSize / (activeDocument.resolution / 72)
		txtLayer.textItem.font = "Verdana";
		txtLayer.textItem.size = UnitValue(textSize + "px");
		txtLayerBounds = getBounds(txtLayer);
		if(type == 'globalX' || type == 'first') {
			txtColor = rgb(255, 255, 255);
			bgColor = rgb(0, 0, 0);
			textPosArray = [0, txtLayerBounds.h];
			if(type == 'globalX') {
				textPosArray = [bounds.x + bounds.w, txtLayerBounds.h];
			}
		} else {
			txtColor = rgb(0, 70, 140);
			bgColor = rgb(0, 255, 255);
			var x = (bounds.x + (bounds.w / 2) - (txtLayerBounds.w / 2));
			var y = (bounds.y + (bounds.h / 2) + (txtLayerBounds.h / 2));
			textPosArray = [x, y];
		}
		txtLayer.textItem.color = txtColor;
		txtLayer.textItem.position = textPosArray;
		txtLayerBounds = getBounds(txtLayer);
		activeDocument.selection.select(txtLayerBounds.rect);
		activeDocument.activeLayer = bgLayer;
		activeDocument.selection.fill(bgColor, ColorBlendMode.NORMAL, 100, false);
		activeDocument.selection.deselect();
	}

	//===================
	// ExportTargetLayer Class
	//===================

	var ExportTargetLayer = function(layer, name, path) {
		this.type = 'normal';
		this.layer = layer;
		this.name = name || layer.name;
		this.areaLayer = null;
		this.bgLayer = null;
		this.settings = {
			fileName: normarizeName(this.name),
			path: path || $outputFolder,
			options: null,
			fileType: null,
			resolution: null,
			trim: false
		};
	}

	ExportTargetLayer.prototype.searchFormatTypeKey = function(str) {
		if(/^(jpg|jpeg)/.test(str)) {
			return '.jpg';
		} else if(/^psd/.test(str)) {
			return '.psd';
		}
		return '.png';
	}

	ExportTargetLayer.prototype.searchQualityKey = function(str) {
		var regExp = /^(jpg|jpeg|png)\((\d+)?\)/;
		if(regExp.test(str)) {
			var quality = parseInt(str.match(regExp)[2]);
			if(quality < 0) quality = 0;
			return quality;
		}
		return null;
	}

	ExportTargetLayer.prototype.searchResolutionKey = function() {
		var regExp = /\((\d+)(%|w|h)\)/i;
		if(regExp.test(this.name)) {
			return {
				type: this.name.match(regExp)[2].toLowerCase(),
				value: this.name.match(regExp)[1]
			};
		}
		return null;
	}

	ExportTargetLayer.prototype.setOptionLayer = function() {
		this.areaLayer = this.getOptionLayer('area');
		this.bgLayer = this.getOptionLayer('bg');
	}

	ExportTargetLayer.prototype.getOptionLayer = function(optionName) {
		if(this.layer == 'dummy') return;
		var regExp;
		var linkedLayers;
		switch(optionName) {
			case 'area':
				regExp = /^\!/;
				break;
			case 'bg':
				regExp = /^\&/;
				break;
			default:
		}
		if(this.layer.linkedLayers.length) {
			linkedLayers = this.layer.linkedLayers;
		} else if(this.layer.parent.typename != 'Document' && this.layer.parent.linkedLayers.length) {
			linkedLayers = this.layer.parent.linkedLayers;
		} else {
			return null;
		}
		for(var i = 0, l = linkedLayers.length; i < l; i++) {
			var linkLayer = linkedLayers[i];
			if(regExp.test(linkLayer.name)) {
				return linkLayer;
			}
		}
		return null;
	}

	ExportTargetLayer.prototype.cropCanvas = function(rectArray) {
		var boundsRect;
		if(rectArray) {
			boundsRect = rectArray;
		} else {
			boundsRect = getBounds(this.layer);
		}
		activeDocument.selection.select(boundsRect);
		var idCrop = charIDToTypeID("Crop");
		var desc = new ActionDescriptor();
		var idDlt = charIDToTypeID("Dlt ");
		desc.putBoolean(idDlt, true);
		executeAction(idCrop, desc, DialogModes.NO);
	}

	ExportTargetLayer.prototype.mergeBackground = function() {
		var targetBounds = getBounds(this.layer);
		var bgBounds = getBounds(this.bgLayer);
		showOnlyLayer([this.layer, this.bgLayer]);
		mergeLayer(this.layer);
	}

	ExportTargetLayer.prototype.convertSmartObj = function() {
		this.layer.locked = false;
		this.layer.visible = true;
		activeDocument.activeLayer = this.layer;
		var idAcrion = stringIDToTypeID("newPlacedLayer");
		executeAction(idAcrion, undefined, DialogModes.NO);
		this.layer = activeDocument.activeLayer;
		return true;
	}

	ExportTargetLayer.prototype.openSmartObj = function() {
		activeDocument.activeLayer = this.layer;
		if(this.layer.kind !== LayerKind.SMARTOBJECT) {
			alert("スマートオブジェクトではありません");
		};
		var idplacedLayerEditContents = stringIDToTypeID("placedLayerEditContents");
		var desc = new ActionDescriptor();
		executeAction(idplacedLayerEditContents, desc, DialogModes.NO);
		this.layer = activeDocument.activeLayer;
		return activeDocument;
	}

	ExportTargetLayer.prototype.resizeExportArea = function() {
		var canvas = {
			'h': parseInt(activeDocument.height.value),
			'w': parseInt(activeDocument.width.value)
		}
		var targetBounds = getBounds(this.layer);
		var trimBounds = getBounds(this.areaLayer);
		this.convertSmartObj();
		this.openSmartObj();
		if(this.settings.fileType !== '.psd') {
			mergeLayer();
		}
		activeDocument.resizeCanvas(canvas.w, canvas.h, AnchorPosition.TOPLEFT);
		activeDocument.layers[0].translate(targetBounds.x, targetBounds.y);
		this.cropCanvas(trimBounds.rect);
	}

	ExportTargetLayer.prototype.createExportOptions = function() {
		var options;
		var _name = this.name.split('.');
		var suffixKey = _name[_name.length - 1];
		var fileType = this.searchFormatTypeKey(suffixKey);
		var quality  = this.searchQualityKey(suffixKey);
		if(!quality) {
			switch(fileType) {
				case '.jpg':
					quality = $quality.jpg;
					break;
				case '.png':
					quality = $quality.png;
					break;
				default:
			}
		}
		if(quality > 100) quality = 'normalSave';
		switch(fileType) {
			case '.psd':
				options = new PhotoshopSaveOptions();
				options.alphaChannels = true;
				options.annotations = true;
				options.embedColorProfile = false;
				options.layers = true;
				options.spotColors = false;
				break;
			case '.jpg':
				// ファイルメニュー > 別名で保存での JPG
				if(quality == "normalSave") {
					options = new JPEGSaveOptions;
					options.embedColorProfile = true; // カラープロファイルを埋め込む
					options.formatOptions = FormatOptions.STANDARDBASELINE;
					options.quality = 12; /* 1 ~ 12 デフォルトは3*/
				}
				// Web用に書き出しでの JPG
				else {
					options = new ExportOptionsSaveForWeb();
					options.format = SaveDocumentType.JPEG;
					options.interlaced = false;
					options.includeProfile = false;
					options.blur = 0; 
					options.quality = quality || $quality.jpg;
					options.optimized = true;
				}
				break;
			case '.png':
				// ファイルメニュー > 別名で保存での PNG
				if(quality == "normalSave") {
					options = new PNGSaveOptions();
					options.interlaced = false;
				}
				// Web用に書き出しでの PNG
				else {
					options = new ExportOptionsSaveForWeb();
					options.format = SaveDocumentType.PNG;
					options.PNG8 = false;
					options.interlaced = false;
					options.optimized = true;
				}

				break;
			default:
		}
		this.settings.resolution = this.searchResolutionKey();
		this.settings.options = options;
		this.settings.fileType = fileType;
		this.settings.quality = quality;
	}

	ExportTargetLayer.prototype.export = function() {
		this.createExportOptions();
		this.setOptionLayer();
		if(this.type == 'normal') {
			if(this.bgLayer) {
				this.mergeBackground();
			}
			if(this.areaLayer) {
				this.resizeExportArea();
			} else {
				this.convertSmartObj();
				this.openSmartObj();
			}
		}
		if(this.settings.resolution) {
			this.changeResolution();
		}
		if(this.settings.trim) trimCanvas();
		createFolder();
		this.outputFile();
		activeDocument.close(SaveOptions.DONOTSAVECHANGES);
		if($searchChilds || this.bgLayer) snapshot.restore();
	}

	ExportTargetLayer.prototype.changeResolution = function(ratio) {
		var newSize;
		var type = "Wdth";
		if(ratio) {
			newSize = Math.round(parseInt(activeDocument.width) * ratio);
		} else {
			switch(this.settings.resolution.type) {
				case "%":
					newSize = Math.round(parseInt(activeDocument.width) * (this.settings.resolution.value / 100));
					break;
				case "w":
					newSize = this.settings.resolution.value;
					break;
				case "h":
					newSize = this.settings.resolution.value;
					type = "Hght";
					break;
				default:
			}
		}

		var idImgS = charIDToTypeID("ImgS");
		var desc = new ActionDescriptor();
		var idType = charIDToTypeID(type);
		var idPxl = charIDToTypeID("#Pxl");
		desc.putUnitDouble(idType, idPxl, parseInt(newSize + '.000000'));
		var idscaleStyles = stringIDToTypeID("scaleStyles");
		desc.putBoolean(idscaleStyles, true);
		var idCnsP = charIDToTypeID("CnsP");
		desc.putBoolean(idCnsP, true);
		var idIntr = charIDToTypeID("Intr");
		var idIntp = charIDToTypeID("Intp");
		var idautomaticInterpolation = stringIDToTypeID("automaticInterpolation");
		desc.putEnumerated(idIntr, idIntp, idautomaticInterpolation);
		executeAction(idImgS, desc, DialogModes.NO);
	}

	ExportTargetLayer.prototype.outputFile = function() {
		var _this = this;
		var fullPath = getExportFullPathName();
		var saveFile = new File(fullPath);
		if(this.settings.fileType == '.psd' || this.settings.quality == 'normalSave') {
			activeDocument.saveAs(saveFile, this.settings.options, true, Extension.LOWERCASE);
			return;
		}
		if($tinyPlugin) {
			this.outputTinyPNG(fullPath);
			return;
		}
		activeDocument.exportDocument(saveFile, ExportType.SAVEFORWEB, this.settings.options);

		function getExportFullPathName() {
			if(/\//.test(_this.settings.fileName)) {
				var saveFolder;
				var array = _this.settings.fileName.split('/');
				if(array.length >= 2) {
					_this.settings.fileName = array.pop();
					_this.settings.path = _this.settings.path + '/' + array.join('/');
					saveFolder = new Folder(_this.settings.path);
					if(!saveFolder.exists) saveFolder.create();
				}
			}
			return _this.settings.path + '/' + _this.settings.fileName + _this.settings.fileType;
		}
	}

	ExportTargetLayer.prototype.outputTinyPNG = function(path) {
		var formatType;
		var idExpr = charIDToTypeID("Expr");
		var desc0 = new ActionDescriptor();
		var idUsng = charIDToTypeID("Usng");
		var desc1 = new ActionDescriptor();
		var idIn = charIDToTypeID("In  ");
		desc1.putPath(idIn, new File(path));
		var idScl = charIDToTypeID("Scl ");
		var idPrc = charIDToTypeID("#Prc");
		desc1.putUnitDouble(idScl, idPrc, 100.000000);
		var idFlTy = charIDToTypeID("FlTy");
		var idtyFT = charIDToTypeID("tyFT");
		switch(this.settings.fileType) {
			case '.jpg':
				formatType = charIDToTypeID("tyJP");
				break;
			case '.png':
				formatType = charIDToTypeID("tyPN");
				break;
			default:
		}
		desc1.putEnumerated(idFlTy, idtyFT, formatType);
		var idtinY = charIDToTypeID("tinY");
		desc0.putObject(idUsng, idtinY, desc1);
		executeAction(idExpr, desc0, DialogModes.NO);	
	}

	//===================
	// SpriteLayer class < ExportTargetLayer Class
	//===================

	var SpriteLayer = function(spriteObj) {
		ExportTargetLayer.call(this, spriteObj.layer);
		this.spriteList = spriteHolder.get.spriteList();
		this.spritePairList = spriteHolder.get.pairSpriteList();
		this.type = 'sprite';
		this.key = spriteObj.key;
		this.bigger = {
			W: false,
			H: false
		}
		this.status = {
			selected: false,
			used: false
		}
	}

	SpriteLayer.prototype = new ExportTargetLayer('dummy', 'dummy');

/*---------------------*/

	SpriteLayer.prototype.sameSize = function(sprite) {
		var bounds = getBounds(this.layer);
		var tBounds = getBounds(sprite.layer);
		if(bounds.h == tBounds.h && bounds.w == tBounds.w) {
			return true;
		}
		if(bounds.h == tBounds.h) {
			return 'H';
		} else if(bounds.w == tBounds.w) {
			return 'W';
		}
		return false;
	}

	SpriteLayer.prototype.getLongSide = function() {
		var bounds = getBounds(this.layer);
		if(bounds.w >= bounds.h) {
			return bounds.w;
		} else {
			return bounds.h;
		}
	}

	SpriteLayer.prototype.selected = function(flag) {
		if(flag == undefined) return this.status.selected;
		this.status.selected = flag;
	}

	SpriteLayer.prototype.used = function(flag) {
		if(flag == undefined) return this.status.used;
		this.status.used = flag;
	}

/*---------------------*/

	SpriteLayer.prototype.getPairSpriteLayer = function(spriteGroup) {
		for(var i = 0, l = spriteGroup.length; i < l; i++) {
			var sprite = spriteGroup[i];
			if(sprite.key == this.key.toUpperCase()) {
				return new SpriteLayer(sprite);
			}
		}
	}

	SpriteLayer.prototype.copyLayer = function(doc) {
		activeDocument = doc;
		this.layer.visible = true;
		this.convertSmartObj();
		activeDocument.activeLayer = this.layer;
		activeDocument.activeLayer.copy();
	}

	SpriteLayer.prototype.pasteLayer = function(doc) {
		activeDocument = doc;
		this.layer = activeDocument.paste();
	}

	SpriteLayer.prototype.moveSpriteTop = function(canvasSize) {
		var x = canvasSize.startX - this.bounds.x;
		var y = this.bounds.y * -1;
		this.layer.translate(x, y);
		this.bounds = getBounds(this.layer);
	}

	SpriteLayer.prototype.moveSpriteBottom = function(canvasSize) {
		var x = canvasSize.startX - this.bounds.x;
		var y = canvasSize.h - (this.bounds.y + this.bounds.h);
		this.layer.translate(x, y);
		this.bounds = getBounds(this.layer);
		return this;
	}

	//===================
	// セットアップ
	//===================

	var setup = function() {
		preferences.rulerUnits = Units.PIXELS;
		preferences.useHistoryLog = false;
		if(app.documents.length === 0) {
			alert('ドキュメントを開いてから実行して下さぃ');
			return false;
		}
		if(!openSettingDialog()) return false;
		return true;
	}

	//===================
	// 実行
	//===================

	if(setup()) {
		var startTime, endTime;
		startTime = new Date();
		snapshot.take();
		if($quickExport) {
			quickExport(activeDocument.activeLayer);
		} else {
			($searchArea == 1) ? selectedStartLayer(activeDocument.activeLayer, screeningLayer) : followLayers(activeDocument, screeningLayer);
			if(spriteHolder.get.spriteList().length) createSprites();
			if(spriteHolder.get.pairSpriteList().length) createPairSprites();
		}
		snapshot.restore();
		if($isRenameLayer) followLayers(activeDocument, correctLayerName);
		endTime = new Date();
		// $.writeln("===< " + (endTime - startTime) + " ms >===");
	}

 })();
