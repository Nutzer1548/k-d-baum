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

	/*
	adds a new point to the current node
	return: the newly created node which represent 'point'.
	*/
	this.add=function(point){
		if(point.length!=point.length){// dimension mismatch
			console.log("Error: Dimension mismatch!");
			return null; 
		}
		let nodeIdx=0;
		if(point[this.dim]>this.pnt[this.dim]) nodeIdx=1;
		if(this.nodes[nodeIdx]==null) this.nodes[nodeIdx]=new KDTree(point, (this.dim+1)%point.length);
		else return this.nodes[nodeIdx].add( point);//, (  this.dim+1)%point.length);
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


	/*
	Finds intersections of 'ray' with 'region'. That are entry and exit-points,
	if they exist), and returns the distance and the actual point.
	ray: [ startPoint, direction]: expects 'direction' to be normalized,
	     otherwise the returnd distance will be scaled by the length of
		 'direction'
	region: [ lowerPoint, upperPoint ]: the region to test intersection on.
	return: [ [distance1, point1], [distance2, point2]]:
	       'distance' is choosen to match ray[0]+distance*ray[1]=point.
		   The number of Elements return depends on the actual number of number
		   of hit points.
	*/
	this.rayRegionIntersection=function(ray, region){
		let hits=[];

		let tmin=Number.MIN_VALUE, tmax=Number.MAX_VALUE;

		let p=Array(ray[0].dim).fill(0); // partial potential hit-point
		for(let dim=0; dim<ray[0].length; dim++){
			if(ray[1][dim]==0){
				if(ray[0][dim]<region[0][dim] || ray[0][dim]>region[1][dim]) return [];
				continue;
			}
			//ray[0][dim]+t*ray[1][dim]=region[0][dim]
			let t0=(region[0][dim]-ray[0][dim])/ray[1][dim];
			let t1=(region[1][dim]-ray[0][dim])/ray[1][dim];
			if(t1<tmin || t0>tmax) return [];
			tmin=Math.max(tmin, t0);
			tmax=Math.min(tmax, t1);
		}// end for dim

		if(tmax<tmin) return [];

		let p0=Array(ray[0].length).fill(0);
		let p1=Array(ray[0].length).fill(0);
		for(let dim=0; dim<ray[0].length; dim++){
			p0[dim]=ray[0][dim]+tmin*ray[1][dim];
			p1[dim]=ray[0][dim]+tmax*ray[1][dim];
		}// end for dim

		return [
			[tmin, p0],
			[tmax, p1]
		];

	};// end #rayRegionIntersection()

}// end KDTree()

/*function demo(){
	let tree=new KDTree();

	let point=[0,0,0];
	let dir=[0.5, 0.4, 0.3];

	let ray=[point, dir];

	let lower=[1,1,1];
	let upper=[2,2,2];

	let region=[lower, upper];


	let ret=tree.rayRegionIntersection(ray, region);
	console.log(ret);
}// end #demo()

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


