# GEE-Based-Mapping-of-LULC
Land Use and Land Cover (LULC) map is a vital prerequisite and input of numerical weather prediction models. LULC is employed in these models to estimate the atmospheric variables, pollutant
concentrations, and hydrological parameters. Thus, an accurate and up-to-date representation of
land surface coverage is essential. In this regrade, this repository proposes a kind of framework based on the Google Earth Engine (GEE) cloud processing system 
to produce LULC maps according to the U.S. Geological Survey (USGS) 24-category scheme by utilization of Landsat 8 imagery at a spatial resolution of
30 m, afterwards, defualt LULC in the Weather Research and Forecasting (WRF) model can be updated using the developed code, resulting in more precise estimations of weather parameters.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [Contact](#contact)

## Installation
To install the WRF model, you can use the official [manuall](https://www2.mmm.ucar.edu/wrf/users/docs/user_guide_V3/contents.html) step by step. 
Or you can also use the [GIS4WRF](https://gis4wrf.github.io/) plugin in QGIS software for your meteorological simulation.
## Usage
To make the best use of this framework, take the following steps into account:
1) Start by obtaining the relevant labels that match the specific LULC classes you need for your study area.
2) Implement the provided code within GEE, incorporating the acquired labels, to produce a highly accurate and up-tp-date USGS 24-category LULC map.
3) Utilize the generated LULC map by the developed Python code to update the default LULC of WRF model.
4) With this updated LULC data, you can export an increase in accuracy when estimating meteorological parameters.
## Features
Land use exhibits dynamic behavior over time.Through the utilization of the suggested framework, a large quantity of satellite imagery can be efficiently
processed within the GEE cloud system, to generate the accurate and up-to-date LULC map. Also, this updated LULC can be used for more realistic and accurate 
simulations of various atmospheric, hydrological and pollution parameters in different WRF models (WRF, WRF-Chem, WRF-Hydro, etc.).
## Contributing
I encourage you to contribute  to help for improving the proposed framework. To do so:
1. Fork the repository to your GitHub account.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Test your changes thoroughly.
5. Push your changes to your branch on your fork.
6. Submit a Pull Request (PR) to our repository's `main` branch with a clear title and description.
## Contact
If you have questions, concerns, or simply want to get in touch with me, there are a few ways to do so:
1. **Issue Tracker:** For bug reports, feature requests, and general discussions, please use the [issue tracker](https://github.com/Mganjirad/GEE-Based-Mapping-of-LULC/issues).
2. **Email:** You can reach out to me via email at [moh.ganjirad@gmail.com](mailto:moh.ganjirad@gmail.com).
I encourage and value your feedback, suggestions, and contributions. Don't hesitate to reach out with any questions or comments.
