var Canvas = require('canvas');
var fs = require('fs');

var canvas = new Canvas(200, 200);
var ctx = canvas.getContext('2d');

ctx.font = '30px Impact';
ctx.rotate(.1);
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.fillText("Awesome!", 50, 100);

var te = ctx.measureText('Awesome!');
ctx.strokeStyle = 'rgba(255,255,255,0.5)';
ctx.beginPath();
ctx.lineTo(50, 102);
ctx.lineTo(50 + te.width, 102);
ctx.stroke();


canvas.toBuffer(function(err, buffer) {
	fs.writeFile('test.png', buffer, function(err) {
		if (err) {
			throw err;
		}
		console.log('Successful');
	});
});