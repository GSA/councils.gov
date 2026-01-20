#!/bin/bash
# Download Playfair Display fonts locally

FONT_DIR="public/assets/fonts"
mkdir -p "$FONT_DIR"

# Download fonts - format: url|filename
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf" -o "$FONT_DIR/playfair-display-regular-400.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vUDQ.ttf" -o "$FONT_DIR/playfair-display-medium-500.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf" -o "$FONT_DIR/playfair-display-semibold-600.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf" -o "$FONT_DIR/playfair-display-bold-700.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKfsukDQ.ttf" -o "$FONT_DIR/playfair-display-black-900.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf" -o "$FONT_DIR/playfair-display-regular-400-italic.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_pqTbtY.ttf" -o "$FONT_DIR/playfair-display-medium-500-italic.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_naUbtY.ttf" -o "$FONT_DIR/playfair-display-semibold-600-italic.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_k-UbtY.ttf" -o "$FONT_DIR/playfair-display-bold-700-italic.ttf"
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_gGUbtY.ttf" -o "$FONT_DIR/playfair-display-black-900-italic.ttf"

echo "All fonts downloaded to $FONT_DIR"
