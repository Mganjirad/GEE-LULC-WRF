# -*- coding: utf-8 -*-
"""
Created on Mon Jan 16 18:27:26 2023

@author: Mohammad Ganjirad
"""
import geopandas as gpd
import netCDF4 as nc 
import numpy as np 
from shapely.geometry import Point
import rasterio
import math 
from collections import Counter
# 
 ##strVar => Location of your geogrid file. by runing the geogrid.exe in WRF model you will have .nc file for each of your domains.
vn = nc.Dataset(strVar)
#lu_1=vn.variables['LANDUSEF']
lu_f = vn.variables['LANDUSEF'][0,:] 
lu_index = vn.variables['LU_INDEX'][0, :] 
dx_NetCDF=vn.DX;
dy_NetCDF=vn.DY;
print(f"NetCDF Dx {dx_NetCDF}")
print(f"NetCDF Dy {dy_NetCDF}")
lo_M = vn.variables['XLONG_M'][0,:] 
la_M = vn.variables['XLAT_M'][0,:] 
vn.close(); 

#Getting RasterValue Base Index!
#path_generatedLULC => Location of New LULC
img = rasterio.open(path_generatedLULC)
z = img.read()[0]
LeftTif=img.bounds.left
RightTif=img.bounds.right
TopTif=img.bounds.top
BottomTif=img.bounds.bottom
ExtentTif=(((abs(LeftTif-RightTif)*(math.pi)) / 180 )* (6.3781*1000000) )
ResTif=round(ExtentTif/ (img.width))
print(f"Tif Resoulotion {ResTif}")
#Define Kernel
KernelDim=int(dx_NetCDF/ResTif)
print(f"Kernel Dimension {KernelDim}")
KernelDimPadding = int(KernelDim/2)
if KernelDim%2 !=0 : KernelDimPadding=int(math.floor(KernelDim/2)+1) 
print(f"Padding base on center of Kernel  {KernelDimPadding}")
Kernel=np.zeros((KernelDim, KernelDim))
def pad_with(vector, pad_width, iaxis, kwargs):

    pad_value = kwargs.get('padder', 10)

    vector[:pad_width[0]] = pad_value

    vector[-pad_width[1]:] = pad_value
    
Z_Paded=np.pad(z,KernelDimPadding,pad_with,padder=-128)
cnt=0

for i in range(lu_index.shape[0]):
        for j in range(lu_index.shape[1]):
            #print("#####################")
            #print(f"i :{i} , j:{j}")
            lonPixTarget=lo_M[i][j]
            latPixTarget=la_M[i][j]
            cnt+=1
            #print(f"Lon Focous {lonPixTarget}")
            #print(f"Lat Focous {latPixTarget}")
            if (lonPixTarget<LeftTif or latPixTarget <BottomTif or lonPixTarget > RightTif or latPixTarget >TopTif) :
                
                #print("Out MBBs")
                a=0
            else:
                idx=img.index(lonPixTarget, latPixTarget,precision=1E-6)
                PixIdx_row=idx[0]
                PixIdx_col=idx[1]
                PixIdx_left=PixIdx_row-KernelDimPadding
                PixIdx_bottom=PixIdx_col - KernelDimPadding
                PixIdx_up=PixIdx_col+KernelDimPadding
                PixIdx_Right=PixIdx_row+KernelDimPadding
                KernelValues=Z_Paded[PixIdx_left:PixIdx_Right+1 , PixIdx_bottom:PixIdx_up+1]
                KernelValuesFlat=KernelValues.flatten()
                Votes=Counter(KernelValuesFlat)
                UniqueValues=np.unique(KernelValuesFlat)
                if (-128) in Votes: del Votes[-128]
                if len(Votes)==0 :  
                    #print("Coor Left") 
                    a=0
                else:
                    
                    MaxLandUse=max(Votes, key=Votes.get)
                    #print(MaxLandUse)
                    lu_index[i,j]=MaxLandUse
                    #print(Votes)
                    for k in Votes:
                        lu_f[k-1][i,j]=Votes[k]/((KernelDim+1)*(KernelDim+1))
                
                

vn = nc.Dataset(strVar,"r+")
vn.variables['LU_INDEX'][0, :]=lu_index
vn.variables['LANDUSEF'][0,:]=lu_f
vn.close();               
print("done")        
            
            
            
           
           
