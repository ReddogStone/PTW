var TILE_SIZE = 256;
var MAX_ZOOM = 20;
var SQUARE_WIDTH_PIXELS = 8;

var SQUARE_WIDTH = SQUARE_WIDTH_PIXELS / (1 << MAX_ZOOM);
var HALF_SQUARE_WIDTH = SQUARE_WIDTH * 0.5;

var COLORS = [
	{ value: {red: 118 / 255, green: 172 / 255, blue: 48 / 255, alpha: 1}, name: 'Green' },
	{ value: {red: 255 / 255, green: 198 / 255, blue: 47 / 255, alpha: 1}, name: 'Orange' },
	{ value: {red: 231 / 255, green: 63 / 255, blue: 21 / 255, alpha: 1}, name: 'Red' },
	{ value: {red: 82 / 255, green: 163 / 255, blue: 219 / 255, alpha: 1}, name: 'Blue' },
	{ value: {red: 0 / 255, green: 0 / 255, blue: 0 / 255, alpha: 1}, name: 'Black' },
	{ value: {red: 255 / 255, green: 255 / 255, blue: 255 / 255, alpha: 1}, name: 'White' }
];

var JSON_RPC_URL = 'ptw.rpc';

var BrushShape = {
	CIRCLE: 0,
	SQUARE: 1,
	LINE: 2
};