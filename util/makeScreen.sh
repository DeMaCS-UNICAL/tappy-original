 #
 # This script gets a screenshot from a screenshot server and trims it for fullscreen display in the calibration page web/cal/index.html
 #
 # usage: ./makeScreen.sh
 #
 # The script will contact the screenshot server (edit IP and port to your taste) and will save the cropped image to web/cal/screenshot.png
 #
 # Requires wget and imagemagick (the convert shell command) installed
 #
 IP_PORT=192.168.0.30:5432
 IMAGE=screenshot.png
 IMPATH=../web/cal
 wget http://$IP_PORT/?name=requestimage -O screenshot.png
 #
 # Removes sidebars
 #
convert -verbose -trim $IMAGE $IMAGE
#
# Remove virtual offset
#
convert -verbose +repage $IMAGE $IMAGE
#
# Crops virtual back-home-square buttons (hardwired size from Huawei P8-Lite). To do only if back-home-square are static
#
# convert -verbose -crop 1007x1676+0+0 $IMAGE $IMAGE
#
# Removes virtual offset and copies final image to destination
#
if [ -s $IMAGE ]
then
   echo "Screenshot exists and is not empty "
   convert -verbose +repage $IMAGE $IMPATH/$IMAGE
else
   echo "Screenshot does not exist, or is empty "
fi
