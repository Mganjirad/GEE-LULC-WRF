///////////////////////////////////////////////////////Input Parameters////////////////////////////////////////////
// var CaBorder ==> Border of your study area.
// var GatheredPgSnow ==> your collected labels of USGS 24-category LULC.
///////////////////////////////////////////////////////Functions////////////////////////////////////////////
// Applies scaling factors.
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}
function mask_clouds_landsat8(image) {
  // Bits 3 and 4 are cloud shadow and cloud, respectively
  var cloudShadowBitMask = (1 << 4); // 1000 in base 2
  var cloudsBitMask = (1 << 3); // 100000 in base 2

  // Get the pixel QA band
  var qa = image.select('QA_PIXEL');

  // Both flags should be set to zero, indicating clear conditions
  var mask = qa
    .bitwiseAnd(cloudShadowBitMask).eq(0)
    .and(qa.bitwiseAnd(cloudsBitMask).eq(0));

  // Mask image with clouds and shadows
  return image.updateMask(mask);
}
function Cmpt_Acc(ClassifierName,classifier,training,validation){
//Training Accurcy  
print('information about classifier:',classifier)
print('Results of trained classifier', classifier.explain());
var trainAccuracy = classifier.confusionMatrix();
print('Training error matrix', trainAccuracy);
print('Training overall accuracy', trainAccuracy.accuracy());
print('Training Kappa statistic', trainAccuracy.kappa());
print('Training F-Score!', trainAccuracy.fscore());
// Calculate variable importance
var importance = ee.Dictionary(classifier.explain().get('importance'))
// Calculate relative importance
var sum = importance.values().reduce(ee.Reducer.sum())
var relativeImportance = importance.map(function(key, val) {
   return (ee.Number(val).multiply(100)).divide(sum)
  })  
print('Relaitive Importance :',relativeImportance)
// Create a FeatureCollection so we can chart it
var importanceFc = ee.FeatureCollection([
  ee.Feature(null, relativeImportance)
])
var chart = ui.Chart.feature.byProperty({
  features: importanceFc
}).setOptions({
      title: 'Feature Importance',
      vAxis: {title: 'Importance'},
      hAxis: {title: 'Feature'}
  })
print(chart)
//Validation Accuracy
var validated = validation.classify(classifier);
var testAccuracy = validated.errorMatrix('class', 'classification');
print('Validation overall accuracy: ', testAccuracy.accuracy());
print('Validation Kappa statistic', testAccuracy.kappa());
print('Validation F-Score!', testAccuracy.fscore());
print('Confusion Mat', testAccuracy);
}
function ndviFun(image){
   var ndvi=image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
   return image.addBands(ndvi);
}
function ndbiFun(image){
   var ndbi=image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');
   return image.addBands(ndbi);
}
function BSIFun(image){
  var bsi=image.expression(
        '((RED+SWIR) + (-1*(NIR+BLUE))) / ((RED+SWIR) + (NIR+BLUE))', {
            'NIR': image.select('SR_B5'),
            'RED': image.select('SR_B4'),
            'BLUE': image.select('SR_B2'),
            'SWIR': image.select('SR_B6'),
        }).rename("BSI");
        return image.addBands(bsi);
}
function NDWIFunc(image){
 var ndwi=image.normalizedDifference(['SR_B3', 'SR_B5']).rename('NDWI');
  return image.addBands(ndwi);
}
///////////////////////////////////////////////////////Dataset Selections!////////////////////////////////////////////
var bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5',
            'SR_B6', 'SR_B7', 'ST_B10','NDVI','NDWI','NDBI','BSI'];
// Winter Date : '2019-11-22', '2020-02-19'
//Summer Date :'2019-05-01', '2019-09-30'
var dataset = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
.filterDate('2019-05-01', '2019-09-30').filterBounds(CaBorder)
.filter(ee.Filter.lt('CLOUD_COVER',10)).map(applyScaleFactors).map(mask_clouds_landsat8).map(ndviFun).map(NDWIFunc).map(ndbiFun).map(BSIFun)
.median().clip(CaBorder)
dataset=dataset.select(bands);
print('Dataset:',dataset);
///////////////////////////////////////////////////////Sampling Region////////////////////////////////////////////
//Convert Table to Featuer Collectionn
var TargetClass_Snow=ee.FeatureCollection(GatheredPgSnow)
var classes = ee.Image().byte().paint(TargetClass_Snow, "LU_Index_E").rename("class").toUint8();
//Add Classes to dataset
//CompleteDataset with Lon and Lat
var CompleteDataset=dataset.addBands(classes).addBands(ee.Image.pixelLonLat());
print('Our Dataset for sampling is :',CompleteDataset);
var AllSampledData=CompleteDataset.stratifiedSample({
  numPoints: 5000,
  classBand: 'class',
  projection: 'EPSG:4326',
  seed:123,
  scale: 1000,
  region: CaBorder,
  tileScale:16,
 }).map(function(f) {
 return f.setGeometry(ee.Geometry.Point([f.get('longitude'), f.get('latitude')]))
   })
// ///////////////////////////////////////////////////////Spilt to train and test////////////////////////////////////////////
 AllSampledData = AllSampledData.randomColumn({seed:123});
 var split = 0.7;  // Roughly 70% training, 30% testing.
 var training = AllSampledData.filter(ee.Filter.lt('random', split));
 var validation = AllSampledData.filter(ee.Filter.gte('random', split));
Map.addLayer(validation,{min:0,max:1},'Validation Points Classic');
///////////////////////////////////////////////////////Defining Model////////////////////////////////////////////
var classifier = ee.Classifier.smileGradientTreeBoost(20).train({
 features: training,  
 classProperty: 'class', 
 inputProperties:ee.List(bands).add('class')
 });
Cmpt_Acc('GTB',classifier,training,validation);
///////////////////////////////////////////////////////Predication////////////////////////////////////////////
var ClassificationMap = dataset.classify(classifier);
///////////////////////////////////////////////////////Visualization////////////////////////////////////////////
var VisualLandsat= {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min:0.044717116411475855,
  max: 0.16250655940855105,
};
//Visual_USGC_Landuse
// Define a palette for the 18 distinct land cover classes.
//  Palette with the colors
var usgsplattle = [
  'cc0013', // urban
  '91af40', //DryLand and CropLand Pasture
  'b76031',//Irrigrated CropLand and Pasture
  'cdb33b', // MixedDry LandCrop Pasture
  '33280d', // crop/Grass mosaic
  '30eb5b',//Crop /Wood Mosaic
  'c3aa69',//GrassLand
  '6a2325',//ShurbLand
  'd9903d',//Mixed ShurbGrassLand
  '369b47',//EverGreen BoradLeaf
  '152106',//EverGreen NeedLeaf
  '225129',//Mixed Forest
  '0000ff', // water
  'FFFF00', // Herbacuse wetlands
  '6f6f6f',  // Woodn Wetland
  'f7e084', // barren
  'FFFFFF',//Snow ice
  ];
var VisualLULC={ min:0,
max:16,
  palette:usgsplattle, 
}
Map.addLayer(ClassificationMap, VisualLULC, 'LULC',false)
///////////////////////////////////////////////////////Add Legend////////////////////////////////////////////
// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
}); 
// Create legend title
var legendTitle = ui.Label({
  value: 'My Legend',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});
 
// Add the title to the panel
legend.add(legendTitle);
 
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
 
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};
// name of the legend
var names = ['1 urban','2 DryLand and CropLand Pasture','3 Irrigrated CropLand and Pasture','4 MixedDry LandCrop Pasture',
'5 crop/Grass mosaic' , '6 rop /Wood Mosaic','7 GrassLand','8 ShurbLand','9 Mixed ShurbGrassLand','13 EverGreen BoradLeaf',
'14 EverGreen NeedLeaf','15 Mixed Forest','16 water','17 Herbacuse wetlands','18 Woodn Wetland','19 barren','24 Snow and Ice'];
 
// Add color and and names
for (var i = 0; i <17; i++) {
  legend.add(makeRow(usgsplattle[i], names[i]));
  }    
 
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);
