
var papaya = papaya || {};
papaya.volume = papaya.volume || {};
papaya.volume.nifti = papaya.volume.nifti || {};


/**
 * Constructor.
 */
papaya.volume.nifti.NIFTI = papaya.volume.nifti.NIFTI || function() {
	// Public properties
	this.errorMessage = null;
	this.littleEndian = false;
	this.dim_info;
	this.dims = new Array();
	this.intent_p1; this.intent_p2; this.intent_p3; this.intent_code;
	this.datatypeCode; this.numBitsPerVoxel;
	this.slice_start; this.slice_end; this.slice_code;
	this.pixDims = new Array();
	this.vox_offset;
	this.scl_slope; this.scl_inter;
	this.xyzt_units;
	this.cal_max; this.cal_min;
	this.slice_duration;
	this.toffset;
	this.description; this.aux_file; this.intent_name;
	this.qform_code; this.sform_code;
	this.quatern_b; this.quatern_c; this.quatern_d; this.qoffset_x; this.qoffset_y; this.qoffset_z;
	this.affine = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
	this.magic;
}


// Public constants
papaya.volume.nifti.MAGIC_COOKIE = 348;
papaya.volume.nifti.NII_HDR_SIZE = 352;

papaya.volume.nifti.DT_NONE                    = 0;
papaya.volume.nifti.DT_BINARY                  = 1;
papaya.volume.nifti.NIFTI_TYPE_UINT8           = 2;
papaya.volume.nifti.NIFTI_TYPE_INT16           = 4;
papaya.volume.nifti.NIFTI_TYPE_INT32           = 8;
papaya.volume.nifti.NIFTI_TYPE_FLOAT32        = 16;
papaya.volume.nifti.NIFTI_TYPE_COMPLEX64      = 32;
papaya.volume.nifti.NIFTI_TYPE_FLOAT64        = 64;
papaya.volume.nifti.NIFTI_TYPE_RGB24         = 128;
papaya.volume.nifti.DT_ALL                   = 255;
papaya.volume.nifti.NIFTI_TYPE_INT8          = 256;
papaya.volume.nifti.NIFTI_TYPE_UINT16        = 512;
papaya.volume.nifti.NIFTI_TYPE_UINT32        = 768;
papaya.volume.nifti.NIFTI_TYPE_INT64        = 1024;
papaya.volume.nifti.NIFTI_TYPE_UINT64       = 1280;
papaya.volume.nifti.NIFTI_TYPE_FLOAT128     = 1536;
papaya.volume.nifti.NIFTI_TYPE_COMPLEX128   = 1792;
papaya.volume.nifti.NIFTI_TYPE_COMPLEX256   = 2048;


// Public methods

/**
 * Read NIFTI header.
 * @param {String} data	The binary string containing header data.
 * @param {Boolean} compressed	True if the data is compressed, false otherwise.
 */
papaya.volume.nifti.NIFTI.prototype.readData = function(data) {
	var rawData = new DataView(data);
	var magicCookieVal = this.getIntAt(rawData, 0, this.littleEndian);

	if (magicCookieVal != papaya.volume.nifti.MAGIC_COOKIE) {  // try as little endian
		this.littleEndian = true;
		magicCookieVal = this.getIntAt(rawData, 0, this.littleEndian);
	}

	if (magicCookieVal != papaya.volume.nifti.MAGIC_COOKIE) {
		this.errorMessage = "This does not appear to be a NIFTI file!";
		return;
	}

	this.dim_info = this.getByteAt(rawData, 39);

	for (var ctr = 0; ctr < 8; ctr++) {
		var index = 40 + (ctr * 2);
		this.dims[ctr] = this.getShortAt(rawData, index, this.littleEndian);
	}

	this.intent_p1 = this.getFloatAt(rawData, 56, this.littleEndian);
	this.intent_p2 = this.getFloatAt(rawData, 60, this.littleEndian);
	this.intent_p3 = this.getFloatAt(rawData, 64, this.littleEndian);
	this.intent_code = this.getFloatAt(rawData, 68, this.littleEndian);

	this.datatypeCode = this.getShortAt(rawData, 70, this.littleEndian);
	this.numBitsPerVoxel = this.getShortAt(rawData, 72, this.littleEndian);

	this.slice_start = this.getShortAt(rawData, 74, this.littleEndian);

	for (var ctr = 0; ctr < 8; ctr++) {
		var index = 76 + (ctr * 4);
		this.pixDims[ctr] = this.getFloatAt(rawData, index, this.littleEndian);
	}

	this.vox_offset = this.getFloatAt(rawData, 108, this.littleEndian);

	this.scl_slope = this.getFloatAt(rawData, 112, this.littleEndian);
	this.scl_inter = this.getFloatAt(rawData, 116, this.littleEndian);

	this.slice_end = this.getShortAt(rawData, 120, this.littleEndian);
	this.slice_code = this.getByteAt(rawData, 122);

	this.xyzt_units = this.getByteAt(rawData, 123);

	this.cal_max = this.getFloatAt(rawData, 124, this.littleEndian);
	this.cal_min = this.getFloatAt(rawData, 128, this.littleEndian);

	this.slice_duration = this.getFloatAt(rawData, 132, this.littleEndian);
	this.toffset = this.getFloatAt(rawData, 136, this.littleEndian);

	this.description = this.getStringAt(rawData, 148, 228);

	this.qform_code = this.getShortAt(rawData, 252, this.littleEndian);
	this.sform_code = this.getShortAt(rawData, 254, this.littleEndian);

	this.quatern_b = this.getFloatAt(rawData, 256, this.littleEndian);
	this.quatern_c = this.getFloatAt(rawData, 260, this.littleEndian);
	this.quatern_d = this.getFloatAt(rawData, 264, this.littleEndian);
	this.qoffset_x = this.getFloatAt(rawData, 268, this.littleEndian);
	this.qoffset_y = this.getFloatAt(rawData, 272, this.littleEndian);
	this.qoffset_z = this.getFloatAt(rawData, 276, this.littleEndian);

	for (var ctrOut = 0; ctrOut < 3; ctrOut++) {
		for (var ctrIn = 0; ctrIn < 4; ctrIn++) {
			var index = 280 + (((ctrOut * 4) + ctrIn) * 4);
			this.affine[ctrOut][ctrIn] = this.getFloatAt(rawData, index, this.littleEndian);
		}
	}

	this.affine[3][0] = 0;
	this.affine[3][1] = 0;
	this.affine[3][2] = 0;
	this.affine[3][3] = 1;

	this.intent_name = this.getStringAt(rawData, 328, 344);
	this.magic = this.getStringAt(rawData, 344, 348);
}


/**
 * Convert NIFTI Qform orientation to Sform.  Taken from nifti1_io.c function nifti_quatern_to_mat44.
 * @param {Numeric} qb
 * @param {Numeric} qc
 * @param {Numeric} qd
 * @param {Numeric} qx
 * @param {Numeric} qy
 * @param {Numeric} qz
 * @param {Numeric} dx
 * @param {Numeric} dy
 * @param {Numeric} dz
 * @param {Numeric} qfac
 */
papaya.volume.nifti.NIFTI.prototype.convertNiftiQFormToNiftiSForm = function(qb, qc, qd, qx, qy, qz, dx, dy, dz, qfac) {
	var R = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
	var a, b, c, d, xd, yd, zd;
	b = qb;
	c = qc;
	d = qd;

	// last row is always [ 0 0 0 1 ]
	R[3][0]=R[3][1]=R[3][2] = 0.0;
	R[3][3]= 1.0;

	// compute a parameter from b,c,d
	a = 1.0 - (b*b + c*c + d*d) ;
	if( a < .0000001 ) {                   /* special case */

		a = 1.0 / Math.sqrt(b*b+c*c+d*d) ;
		b *= a ;
		c *= a ;
		d *= a ;        /* normalize (b,c,d) vector */
		a = 0.0 ;                        /* a = 0 ==> 180 degree rotation */
	} else {

		a = Math.sqrt(a) ;                     /* angle = 2*arccos(a) */
	}

	// load rotation matrix, including scaling factors for voxel sizes
	xd = (dx > 0.0) ? dx : 1.0 ;       /* make sure are positive */
	yd = (dy > 0.0) ? dy : 1.0 ;
	zd = (dz > 0.0) ? dz : 1.0 ;

	if( qfac < 0.0 )
		zd = -zd ;         /* left handedness? */

	R[0][0] =       (a*a+b*b-c*c-d*d) * xd ;
	R[0][1] = 2.0 * (b*c-a*d        ) * yd ;
	R[0][2] = 2.0 * (b*d+a*c        ) * zd ;
	R[1][0] = 2.0 * (b*c+a*d        ) * xd ;
	R[1][1] =       (a*a+c*c-b*b-d*d) * yd ;
	R[1][2] = 2.0 * (c*d-a*b        ) * zd ;
	R[2][0] = 2.0 * (b*d-a*c        ) * xd ;
	R[2][1] = 2.0 * (c*d+a*b        ) * yd ;
	R[2][2] =       (a*a+d*d-c*c-b*b) * zd ;

	// load offsets
	R[0][3] = qx ;
	R[1][3] = qy ;
	R[2][3] = qz ;

	return R;
}


/**
 * Convert NIFTI Sform orientation to NEMA style orientation (e.g., XYZ+--).  Adapted from nifti1_io.c function nifti_mat44_to_orientation().
 * @param {Array} R
 */
papaya.volume.nifti.NIFTI.prototype.convertNiftiSFormToNEMA = function(R) {
    var xi, xj, xk, yi, yj, yk, zi, zj, zk, val, detQ, detP;
    var i, j, k, p, q, r, ibest, jbest, kbest, pbest, qbest, rbest;
    k = 0;
    var vbest;
    
    var Q = [[0,0,0],[0,0,0],[0,0,0]];
    var P = [[0,0,0],[0,0,0],[0,0,0]];
    
    //if( icod == NULL || jcod == NULL || kcod == NULL ) return ; /* bad */
    
    //*icod = *jcod = *kcod = 0 ; /* this.errorMessage returns, if sh*t happens */
    
    /* load column vectors for each (i,j,k) direction from matrix */
    
    /*-- i axis --*/ /*-- j axis --*/ /*-- k axis --*/
    
    xi = R[0][0]; xj = R[0][1]; xk = R[0][2];
    yi = R[1][0]; yj = R[1][1]; yk = R[1][2];
    zi = R[2][0]; zj = R[2][1]; zk = R[2][2];
    
    /* normalize column vectors to get unit vectors along each ijk-axis */
    
    /* normalize i axis */
    val = Math.sqrt( xi*xi + yi*yi + zi*zi ) ;
    if( val == 0.0 ) return null;                 /* stupid input */
    xi /= val; yi /= val; zi /= val;
    
    /* normalize j axis */
    val = Math.sqrt( xj*xj + yj*yj + zj*zj ) ;
    if( val == 0.0 ) return null;                 /* stupid input */
    xj /= val; yj /= val; zj /= val;
    
    /* orthogonalize j axis to i axis, if needed */
    val = xi*xj + yi*yj + zi*zj ;    /* dot product between i and j */
    if( Math.abs(val) > 1.E-4 ) {
        
        xj -= val*xi ; yj -= val*yi ; zj -= val*zi ;
        val = Math.sqrt( xj*xj + yj*yj + zj*zj ) ;  /* must renormalize */
        if( val == 0.0 ) return null;              /* j was parallel to i? */
        xj /= val; yj /= val; zj /= val;
    }
    
    /* normalize k axis; if it is zero, make it the cross product i x j */
    val = Math.sqrt( xk*xk + yk*yk + zk*zk ) ;
    if( val == 0.0 ) { xk = yi*zj-zi*yj; yk = zi*xj-zj*xi; zk=xi*yj-yi*xj; }
    else            { xk /= val; yk /= val; zk /= val; }
    
    /* orthogonalize k to i */
    val = xi*xk + yi*yk + zi*zk;    /* dot product between i and k */
    if( Math.abs(val) > 1.E-4 ){
        
        xk -= val*xi; yk -= val*yi; zk -= val*zi;
        val = Math.sqrt( xk*xk + yk*yk + zk*zk );
        if( val == 0.0 ) return null;      /* bad */
        xk /= val; yk /= val; zk /= val;
    }
    
    /* orthogonalize k to j */
    val = xj*xk + yj*yk + zj*zk;    /* dot product between j and k */
    if( Math.abs(val) > 1.e-4 ){
        
        xk -= val*xj ; yk -= val*yj ; zk -= val*zj ;
        val = Math.sqrt( xk*xk + yk*yk + zk*zk ) ;
        if( val == 0.0 ) return null;      /* bad */
        xk /= val ; yk /= val ; zk /= val ;
    }
    
    Q[0][0] = xi; Q[0][1] = xj; Q[0][2] = xk;
    Q[1][0] = yi; Q[1][1] = yj; Q[1][2] = yk;
    Q[2][0] = zi; Q[2][1] = zj; Q[2][2] = zk;
    
    /* at this point, Q is the rotation matrix from the (i,j,k) to (x,y,z) axes */
    
    detQ = this.nifti_mat33_determ(Q) ;
    if( detQ == 0.0 ) return null; /* shouldn't happen unless user is a DUFIS */
    
    /* Build and test all possible +1/-1 coordinate permutation matrices P;
     then find the P such that the rotation matrix M=PQ is closest to the
     identity, in the sense of M having the smallest total rotation angle. */
    
    /* Despite the formidable looking 6 nested loops, there are
     only 3*3*3*2*2*2 = 216 passes, which will run very quickly. */
    
    vbest = -666.0 ; ibest=pbest=qbest=rbest=1 ; jbest=2 ; kbest=3 ;
    for( i=1 ; i <= 3 ; i++ ){     /* i = column number to use for row #1 */
		for( j=1 ; j <= 3 ; j++ ){    /* j = column number to use for row #2 */
            if( i == j ) continue ;
            for( k=1 ; k <= 3 ; k++ ){  /* k = column number to use for row #3 */
                if( i == k || j == k ) continue ;
                P[0][0] = P[0][1] = P[0][2] =
                P[1][0] = P[1][1] = P[1][2] =
                P[2][0] = P[2][1] = P[2][2] = 0.0 ;
                for( p=-1 ; p <= 1 ; p+=2 ){    /* p,q,r are -1 or +1      */
                    for( q=-1 ; q <= 1 ; q+=2 ){   /* and go into rows #1,2,3 */
                        for( r=-1 ; r <= 1 ; r+=2 ){
                            P[0][i-1] = p ; P[1][j-1] = q ; P[2][k-1] = r ;
                            detP = this.nifti_mat33_determ(P) ;           /* sign of permutation */
                            if( detP * detQ <= 0.0 ) continue ;  /* doesn't match sign of Q */
                            M = this.nifti_mat33_mul(P,Q) ;
                            
                            /* angle of M rotation = 2.0*acos(0.5*sqrt(1.0+trace(M)))       */
                            /* we want largest trace(M) == smallest angle == M nearest to I */
                            
                            val = M[0][0] + M[1][1] + M[2][2] ; /* trace */
                            if( val > vbest ) {
                                vbest = val ;
                                ibest = i ; jbest = j ; kbest = k ;
                                pbest = p ; qbest = q ; rbest = r ;
                            }
                        }}}}}}
    
    /* At this point ibest is 1 or 2 or 3; pbest is -1 or +1; etc.
     
     The matrix P that corresponds is the best permutation approximation
     to Q-inverse; that is, P (approximately) takes (x,y,z) coordinates
     to the (i,j,k) axes.
     
     For example, the first row of P (which contains pbest in column ibest)
     determines the way the i axis points relative to the anatomical
     (x,y,z) axes.  If ibest is 2, then the i axis is along the y axis,
     which is direction P2A (if pbest > 0) or A2P (if pbest < 0).
     
     So, using ibest and pbest, we can assign the output code for
     the i axis.  Mutatis mutandis for the j and k axes, of course. */
    
    var iChar, jChar, kChar, iSense, jSense, kSense;
    iChar = jChar = kChar = iSense = jSense = kSense = 0;
    
    switch( ibest*pbest ) {
            
        case  1: /*i = NIFTI_L2R*/ iChar = 'X'; iSense = '+'; break;
        case -1: /*i = NIFTI_R2L*/ iChar = 'X'; iSense = '-'; break;
        case  2: /*i = NIFTI_P2A*/ iChar = 'Y'; iSense = '+'; break;
        case -2: /*i = NIFTI_A2P*/ iChar = 'Y'; iSense = '-'; break;
        case  3: /*i = NIFTI_I2S*/ iChar = 'Z'; iSense = '+'; break;
        case -3: /*i = NIFTI_S2I*/ iChar = 'Z'; iSense = '-'; break;
    }
    
    switch( jbest*qbest ) {
            
        case  1: /*j = NIFTI_L2R*/ jChar = 'X'; jSense = '+'; break;
        case -1: /*j = NIFTI_R2L*/ jChar = 'X'; jSense = '-'; break;
        case  2: /*j = NIFTI_P2A*/ jChar = 'Y'; jSense = '+'; break;
        case -2: /*j = NIFTI_A2P*/ jChar = 'Y'; jSense = '-'; break;
        case  3: /*j = NIFTI_I2S*/ jChar = 'Z'; jSense = '+'; break;
        case -3: /*j = NIFTI_S2I*/ jChar = 'Z'; jSense = '-'; break;
    }
    
    switch( kbest*rbest ) {
            
        case  1: /*k = NIFTI_L2R*/ kChar = 'X'; kSense = '+'; break;
        case -1: /*k = NIFTI_R2L*/ kChar = 'X'; kSense = '-'; break;
        case  2: /*k = NIFTI_P2A*/ kChar = 'Y'; kSense = '+'; break;
        case -2: /*k = NIFTI_A2P*/ kChar = 'Y'; kSense = '-'; break;
        case  3: /*k = NIFTI_I2S*/ kChar = 'Z'; kSense = '+'; break;
        case -3: /*k = NIFTI_S2I*/ kChar = 'Z'; kSense = '-'; break;
    }
    
    return ("" + iChar + jChar + kChar + iSense + jSense + kSense);
}


/**
 * Matrix multiply.  From nifti1_io.c.
 * @param {Array} A	first matrix
 * @param {Array} B	second matrix
 * @return {Array}	result
 */
papaya.volume.nifti.NIFTI.prototype.nifti_mat33_mul = function(A, B) {
    var C = [[0,0,0],[0,0,0],[0,0,0]];
    var i,j;
    
    for( i=0 ; i < 3 ; i++ )
		for( j=0 ; j < 3 ; j++ )
            C[i][j] =  A[i][0] * B[0][j]
            + A[i][1] * B[1][j]
            + A[i][2] * B[2][j] ;
    return C;
}


/**
 * Compute the determinant of a 3x3 matrix.  From nifti1_io.c
 * @param {Array} R	matrix
 * @return {Numeric}	result
 */
papaya.volume.nifti.NIFTI.prototype.nifti_mat33_determ = function(R) {
    var r11,r12,r13,r21,r22,r23,r31,r32,r33;
    /*  INPUT MATRIX:  */
    r11 = R[0][0]; r12 = R[0][1]; r13 = R[0][2];		/* [ r11 r12 r13 ] */
    r21 = R[1][0]; r22 = R[1][1]; r23 = R[1][2];		/* [ r21 r22 r23 ] */
    r31 = R[2][0]; r32 = R[2][1]; r33 = R[2][2];		/* [ r31 r32 r33 ] */
    
    return (r11*r22*r33-r11*r32*r23-r21*r12*r33 + r21*r32*r13+r31*r12*r23-r31*r22*r13);
}


/**
 * Get string value from raw data.
 * @param {DataView} data	raw data in DataView form
 * @param {Numeric} start	starting index
 * @param {Numeric} end	ending index
 * @return {String}	the resulting string
 */
papaya.volume.nifti.NIFTI.prototype.getStringAt = function(data, start, end) {
	var str = "";

	for (var ctr = start; ctr < end; ctr++) {
		str += String.fromCharCode(data.getUint8(ctr));
	}

	return str;
}
	

/**
 * Get byte value from raw data.
 * @param {DataView} data	raw data in DataView form
 * @param {Numeric} start	index
 * @return {Numeric}	the byte value
 */
papaya.volume.nifti.NIFTI.prototype.getByteAt = function(data, start) {
	return data.getInt8(start); 
}


/**
 * Gets 2-byte integer value from raw data.
 * @param {DataView} data	raw data in DataView form
 * @param {Numeric} start	index
 * @param {Boolean} littleEndian	true if data is in little endian order
 * @return {Numeric}	the 2-byte integer value
 */
papaya.volume.nifti.NIFTI.prototype.getShortAt = function(data, start, littleEndian) {
	return data.getInt16(start, littleEndian); 
}


/**
 * Get 4-byte integer value from raw data.
 * @param {DataView} data	raw data in DataView form
 * @param {Numeric} start	index
 * @param {Boolean} littleEndian	true if data is in little endian order
 * @return {Numeric}	the 4-byte integer value
 */
papaya.volume.nifti.NIFTI.prototype.getIntAt = function(data, start, littleEndian) {
	return data.getInt32(start, littleEndian); 
}
	

/**
 * Get 4-byte float value from raw data.
 * @param {DataView} data	raw data in DataView form
 * @param {Numeric} start	index
 * @param {Boolean} littleEndian	true if data is in little endian order
 * @return {Numeric}	the 4-byte float value
 */
papaya.volume.nifti.NIFTI.prototype.getFloatAt = function(data, start, littleEndian) {
	return data.getFloat32(start, littleEndian); 
}
	
	
/**
 * Test whether this object is in error state.
 * @param {Boolean}	True if this object is in error state.
 */
papaya.volume.nifti.NIFTI.prototype.hasError = function() {
	return (this.errorMessage != null);
}



papaya.volume.nifti.NIFTI.prototype.getQformMat = function() {
    return this.convertNiftiQFormToNiftiSForm(this.quatern_b, this.quatern_c, this.quatern_d, this.qoffset_x, this.qoffset_y, this.qoffset_z, this.pixDims[1], this.pixDims[2], this.pixDims[3], this.pixDims[0]);
}
