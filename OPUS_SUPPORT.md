# OPUS Audio Format Support in Audalithic

This document explains how OPUS audio format support has been implemented in Audalithic and provides guidance for using OPUS files effectively.

## Overview

Audalithic now supports both MP3 and OPUS audio formats. OPUS is a modern, open-source audio codec that provides excellent compression and quality, often outperforming MP3 at similar bitrates.

## Browser Compatibility

### ✅ Full Support
- **Chrome/Chromium** 33+
- **Firefox** 15+
- **Edge** 14+
- **Opera** 20+
- **Samsung Internet** 5+

### ⚠️ Limited/Partial Support
- **Safari Desktop** 11+ (partial - requires specific encoding)
- **Safari iOS** 11+ (partial - requires specific encoding)

### ❌ No Support
- **Internet Explorer** (all versions)
- **Opera Mini** (all versions)

## How It Works

1. **Manifest Generation**: The `generate_manifest.py` script now scans for both `.mp3` and `.opus` files
2. **Format Detection**: Each song entry in the manifest includes format information
3. **Smart Loading**: Howler.js attempts to load OPUS files with appropriate fallbacks
4. **Error Handling**: If OPUS fails to load, the system provides detailed error messages and graceful fallbacks

## Using OPUS Files

### Recommended Approach

For maximum compatibility, provide both OPUS and MP3 versions of your audio files:

```
public/audio/English/
├── song1.opus
├── song1.mp3
├── song2.opus
├── song2.mp3
```

### OPUS-Only Approach

You can use OPUS-only files, but be aware of browser compatibility limitations:

```
public/audio/English/
├── song1.opus
├── song2.opus
```

## Creating OPUS Files

### Using FFmpeg

```bash
# Convert MP3 to OPUS
ffmpeg -i input.mp3 -c:a libopus -b:a 128k output.opus

# Convert WAV to OPUS with high quality
ffmpeg -i input.wav -c:a libopus -b:a 192k output.opus

# Convert with specific settings for web
ffmpeg -i input.wav -c:a libopus -b:a 128k -application audio output.opus
```

### For Safari Compatibility

Safari requires OPUS to be in a CAF container for better compatibility:

```bash
# Create OPUS in CAF container for Safari
ffmpeg -i input.wav -c:a libopus -b:a 128k output.caf
```

## Configuration

The app automatically detects and configures OPUS support. No additional configuration is required.

### Howler.js Configuration

The app uses format-specific configuration for optimal loading:

```javascript
// For OPUS files
format: ['opus', 'mp3']  // Try OPUS first, fallback to MP3

// For MP3 files  
format: ['mp3']  // Use MP3 only
```

## Troubleshooting

### OPUS Files Not Playing

1. **Check Browser Compatibility**: Ensure you're using a supported browser
2. **Verify File Format**: Make sure the file is actually OPUS-encoded, not just renamed
3. **Check Console**: Look for detailed error messages in the browser console
4. **Test with MP3**: Temporarily rename the OPUS file and provide an MP3 version

### Error Messages

Common error patterns and solutions:

```
Error preloading next song: [song] Format: opus Error: [details]
```

**Solution**: The OPUS file couldn't be loaded. Check browser compatibility and file encoding.

### Converting Existing Files

```bash
# Batch convert all MP3 files to OPUS in a directory
find . -name "*.mp3" -exec sh -c 'ffmpeg -i "$1" -c:a libopus -b:a 128k "${1%.mp3}.opus"' _ {} \;
```

## Best Practices

1. **Dual Format Strategy**: Provide both OPUS and MP3 for maximum compatibility
2. **Quality Settings**: Use 128-192kbps for OPUS (equivalent to 192-256kbps MP3)
3. **File Naming**: Keep consistent naming between formats (`song.opus` and `song.mp3`)
4. **Testing**: Test OPUS files in multiple browsers before deployment
5. **Fallbacks**: Always have MP3 fallbacks for critical audio content

## Performance Benefits

OPUS offers several advantages over MP3:

- **Better Compression**: 20-30% smaller files at equivalent quality
- **Lower Latency**: Better for real-time applications
- **Modern Codec**: Designed for modern web standards
- **Royalty-Free**: No licensing fees

## Implementation Details

### Manifest Structure

The new manifest format includes format information:

```json
{
  "languages": {
    "English": [
      {
        "title": "Song Name",
        "format": "opus"
      },
      {
        "title": "Another Song", 
        "format": "mp3"
      }
    ]
  }
}
```

### Backward Compatibility

The implementation maintains backward compatibility with existing MP3-only manifests.

## Support and Issues

If you encounter issues with OPUS playback:

1. Check the browser console for detailed error messages
2. Verify your OPUS files are properly encoded
3. Test in multiple browsers
4. Consider providing MP3 fallbacks for problematic files

For Safari-specific issues, consider using OPUS in CAF containers or stick with MP3 for iOS/Safari users. 