var ImageLayer = (function() {
	ImageLayerProto = {
		getTile: function(coord, zoom, ownerDocument) {
			var image = ownerDocument.createElement('img');
			image._coord = coord;
			image.src = this._imageSourceDir + '/' + coord.x + '_' + coord.y + '.png';

			this._tiles[coord.x + '_' + coord.y] = image;

			return image;

			var tileSize = this.tileSize;

			var canvas = ownerDocument.createElement('canvas');
			canvas._coord = coord;
			canvas.width = tileSize.width;
			canvas.height = tileSize.height;

/*			var context = canvas.getContext('2d');
			context.fillStyle = 'white';
			context.fillRect(0, 0, canvas.width, canvas.height);*/

			this._tiles[coord.x + ':' + coord.y] = canvas;
			canvas.context = canvas.getContext('2d');
			canvas.context.moveTo(0, 0);

			return canvas;
		},
		releaseTile: function(tile) {
			var coord = tile._coord;
			delete this._tiles[coord.x + ':' + coord.y];
		}
	};

	function ImageLayer(tileSize, imageSourceDir) {
		var result = Object.create(ImageLayerProto);
		result.tileSize = tileSize;
		result._imageSourceDir = imageSourceDir;
		result._tiles = {};
		return result;
	}

	return ImageLayer;
})();