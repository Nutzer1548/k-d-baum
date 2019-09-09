"use strict";
/* kdtree.js

*/

/* KDTree(point, dimension,)
Creates a new k-d-tree(-node).
point: []: the point coordinates
dimension: the index of the dimension to decide child node insertion. if not defined: 0

*/
function KDTree(point, dimension){
	if(typeof dimension==="undefined") dimension=0;

	this.pnt=point;
	this.dim=dimension;
	this.nodes=[null,null];

	/* adds a new Point to the current node
	*/
	this.add=function(point){
		if(point.length!=point.length){// dimension mismatch
			console.log("Error: Dimension mismatch!");
			return null; 
		}
		let nodeIdx=0;
		if(point[this.dim]>this.pnt[this.dim]) nodeIdx=1;
		if(this.nodes[nodeIdx]==null) this.nodes[nodeIdx]=new KDTree(point, (this.dim+1)%point.length);
		else this.nodes[nodeIdx].add( point);//, (  this.dim+1)%point.length);
		return this.nodes[nodeIdx];
	};// end #add();

	/*
	finds the point in this KDTree, that's nearest to point 'point'
	return: [point_in_tree, distance]
	*/
	this.findNearestPoint=function(point, minDist){
		if(typeof minDist==="undefined") minDist=Number.MAX_VALUE;

		let dist=this.pointDistance(this.pnt, point);
		let pit=null;
		let pit2=null;
		if(dist<minDist){
			pit=this.pnt;
			minDist=dist;
		}

		if(this.nodes[1]!==null){
			if(point[this.dim]+minDist > this.pnt[this.dim]) [pit2,minDist]=this.nodes[1].findNearestPoint(point,minDist);
			if(pit2!==null) pit=pit2;
		}
		if(this.nodes[0]!==null){
			if(point[this.dim]-minDist <= this.pnt[this.dim]) [pit2, minDist]=this.nodes[0].findNearestPoint(point, minDist);
			if(pit2!==null) pit=pit2;
		}

		return [pit, minDist];
	};// end #findNearestPoint()


	/* returns the distance between two points
	*/
	this.pointDistance=function(pnt1, pnt2){
		if(pnt1.length!=pnt2.length){
			console.log('dimension mismatch');
			return Number.MAX_VALUE;
		}
		let p=new Array(pnt1.length);
		let sum=0;
		for(let i=0; i<pnt1.length; i++){
			let p=pnt1[i]-pnt2[i];
			sum+=p*p;
		}
		return Math.sqrt(sum);
	};// end #pointDistance()

	/*
	finds the smalles value in dimension 'dimension' and returns it.
	minVal: current smallest value. if not defined: value of current point in requested dimension
	*/
	this.findMin=function(dimension, minVal){
		if(typeof minVal==="undefined") minVal=this.pnt[dimension];
		else minVal=Math.min(minVal, this.pnt[dimension]);

		if(this.nodes[0]!==null) minVal=this.nodes[0].findMin(dimension, minVal);
		if(this.dim!=dimension){
			if(this.nodes[1]!==null) minVal=this.nodes[1].findMin(dimension, minVal);
		}

		return minVal;
	};// end #findMin()


	/*
	Finds the smalles region that contains 'point'
	point: Point to location region for
	region: [ lowerPoint, upperPoint]: starting-region. If not defined, set to
	        maximum possible range (Number.MIN_VALUE - Number.MAX_VALUE)
	return: the located region
	*/
	this.findRegion=function(point, region){
		if(typeof region==="undefined") region=[Array(point.length).fill(Number.MIN_VALUE), Array(point.length).fill(Number.MAX_VALUE)];
		let nodeIdx=0;
		if(point[this.dim]>this.pnt[this.dim]) nodeIdx=1;
		region[1-nodeIdx][this.dim]=this.pnt[this.dim]; 
		if(this.nodes[nodeIdx]!==null) region=this.nodes[nodeIdx].findRegion(point, region);

		return region;
	};// end #findRegion()
}// end KDTree()


/*
t=0;
// t=inters[1][0]+0.00001;
[n,selRect]=treeFindRegion(ray.x+t*ray.dx, ray.y+t*ray.dy);
draw();
inters=rayRectIntersection(ray, selRect);

tree=new KDTree(points[0].toArray()); for(let i=1; i<points.length; i++) tree.add(points[i].toArray())
tree.findNearestNode([100,200])
treeFindNearest([100,200])
*/


