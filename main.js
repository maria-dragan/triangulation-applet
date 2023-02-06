const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const elems = {
	"showRings": document.getElementById("showRings"),
	"showQuake": document.getElementById("showQuake"),
	"controls": document.getElementById("controlsdiv"),
	"controlsHeader": document.getElementById("controlsHeader"),
	"showHideControls": document.getElementById("showHideControls"),
	"controlsBody": document.getElementById("controlsBody")
};

const stationRadius = 8;
const stationColor = "#bbb";
const stationOutlineWidth = 2;
const stationOutlineColor = "#111111";

const quake = {x:200, y:200};
const quakeRadius = 10;
const quakeColor = "#b22";
const quakeOutlineWidth = 2;
const quakeOutlineColor = "#111";

const ringColor = "#2f2";
const ringWidth = 3;



/////////////

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
	if(window.innerWidth <= window.innerHeight) {
		alert("It is advised to view this applet in landscape orientation")
	}
	if(canvas.width > canvas.height*2) {
		canvas.style.backgroundSize = canvas.height*2 + "px " + canvas.height*2 + "px";
	}
	else {
		canvas.style.backgroundSize = canvas.width + "px " + canvas.width + "px";
	}
	clampAllObjects();
    redraw();
}

function drawCircle(x, y, radius, color, outlineColor, outlineWidth) {
	ctx.fillStyle = color;
    ctx.beginPath();
    if(outlineColor && outlineWidth) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.arc(x, y, radius-outlineWidth/2, 0, 2*Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }
    else {
        ctx.arc(x, y, radius, 0, 2*Math.PI, false);
        ctx.fill();
    }
}

function drawRing(x, y, radius, ringWidth, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = ringWidth;
    ctx.arc(x, y, radius, 0, 2*Math.PI, false);
    ctx.stroke();
}

function getDist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2-x1, 2)+Math.pow(y2-y1, 2));
}

function randomFloatRange(min, max) {
	return Math.random()*(max-min)+min;
}

///////////////////////////////////////

let mouseHold = false;
const mousePos = {x:0, y:0};
const lastMousePos = {x:0, y:0};
const stations = new Set();
let heldObj = null;


function redraw() {
    //clear screen
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	//draw rings
	if(elems.showRings.checked) {
		for(const station of stations) {
			drawRing(station.x, station.y, getDist(station.x, station.y, quake.x, quake.y), ringWidth, ringColor);
		}
	}
	
	//draw stations
	for(const station of stations) {
        drawCircle(station.x, station.y, stationRadius, stationColor, stationOutlineColor, stationOutlineWidth);
    }
	
	//draw quake
    if(elems.showQuake.checked) {
		drawCircle(quake.x, quake.y, quakeRadius, quakeColor, quakeOutlineColor, quakeOutlineWidth);
	}
}

function randomQuake() {
	quake.x = Math.round(randomFloatRange(0+canvas.width/4, canvas.width-canvas.width/4));
	quake.y = Math.round(randomFloatRange(0+canvas.height/4, canvas.height-canvas.height/4));
	redraw();
}

function clampAllObjects() {
	for(const station of stations) {
		station.x = Math.min(station.x, canvas.width);
		station.y = Math.min(station.y, canvas.height);
	}
	quake.x = Math.min(quake.x, canvas.width);
	quake.y = Math.min(quake.y, canvas.height);
}

function getStationAtPos(x, y) {
    for(const station of stations) {
        if(getDist(x, y, station.x, station.y) <= stationRadius) {
            return station;
        }
    }
    return null;
}

function isQuakeAtPos(x, y) {
	return getDist(x, y, quake.x, quake.y) <= quakeRadius;
}

function addStation(x, y) {
    const station = {x:x, y:y};
    stations.add(station);
    redraw();
    return station;
}

function removeStation(station) {
    stations.delete(station);
    if(heldObj===station) {
        heldObj = null;
    }
    redraw();
}

function removeStations() {
	stations.clear();
	heldObj = null;
	redraw();
}

function bringStationToForeground(station) {
    stations.delete(station);
    stations.add(station);
	redraw();
    return station;
}

function setMousePos(x, y) {
    lastMousePos.x = mousePos.x;
    lastMousePos.y = mousePos.y;
    mousePos.x = x;
    mousePos.y = y;
    if(heldObj) {
        heldObj.x += mousePos.x-lastMousePos.x;
        heldObj.y += mousePos.y-lastMousePos.y;
    }
	redraw();
}

canvas.addEventListener("mousedown", function(e) {
    e.preventDefault();
	
	//right click
    if(e.button===2) {
        const station = getStationAtPos(mousePos.x, mousePos.y);
        if(station) {
            removeStation(station);
        }
        return;
    }

    //left click
    if(e.button===0) {
        if(heldObj) return;

		if(isQuakeAtPos(mousePos.x, mousePos.y)) {
			heldObj = quake;
		}
		else {
			let station = getStationAtPos(mousePos.x, mousePos.y);
			if(station) {
				bringStationToForeground(station);
			}
			else {
				station = addStation(mousePos.x, mousePos.y);
			}
			heldObj = station;
		}
    }
});

canvas.addEventListener("mousemove", function(e) {
    e.preventDefault();
	const canvasBound = canvas.getBoundingClientRect();
    setMousePos(e.clientX-canvasBound.left, e.clientY-canvasBound.top);
});

window.addEventListener("mouseup", function(e) {
	heldObj = null;
});

canvas.addEventListener("contextmenu", function(e) {
    e.preventDefault();
});


////////////
//draggable controls adapted from https://www.w3schools.com/howto/howto_js_draggable.asp

function makeDraggableElement(elem, dragger) {
	let lastMouseX = 0;
	let lastMouseY = 0;
	let mouseX = 0;
	let mouseY = 0;
	
	dragger.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		e.preventDefault();
		mouseX = e.clientX;
		mouseY = e.clientY;
		window.addEventListener("mouseup", closeDragElement);
		window.addEventListener("mousemove", elementDrag);
	}

	function elementDrag(e) {
		e.preventDefault();
		lastMouseX = mouseX - e.clientX;
		lastMouseY = mouseY - e.clientY;
		mouseX = e.clientX;
		mouseY = e.clientY;
		elem.style.top = (elem.offsetTop - lastMouseY) + "px";
		elem.style.left = (elem.offsetLeft - lastMouseX) + "px";
	}

	function closeDragElement() {
		window.removeEventListener("mouseup", closeDragElement);
		window.removeEventListener("mousemove", elementDrag);
	}
}

//make controls draggable
makeDraggableElement(elems.controls, elems.controlsHeader);

///////

function toggleControls() {
	if(elems.controlsBody.classList.contains("invisible")) {
		elems.controlsBody.classList.remove("invisible");
		elems.showHideControls.innerText = "Hide";
	}
	else {
		elems.controlsBody.classList.add("invisible");
		elems.showHideControls.innerText = "Show";
	}
}


resizeCanvas();

quake.x = Math.round(canvas.width/2);
quake.y = Math.round(canvas.height/2);