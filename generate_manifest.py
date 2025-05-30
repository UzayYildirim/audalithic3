#!/usr/bin/env python3
"""
Audio Manifest Generator for Audalithic

This script scans the public/audio directory and generates a manifest.json file
that can be uploaded to your music server.

Usage:
    python generate_manifest.py

Output:
    - manifest.json (in current directory)
    - Prints summary of found files
"""

import os
import json
import sys
from pathlib import Path

def generate_manifest():
    """Generate manifest.json from public/audio directory structure."""
    
    # Define the audio directory path
    audio_dir = Path("public/audio")
    
    if not audio_dir.exists():
        print("❌ Error: public/audio directory not found!")
        print("   Make sure you're running this script from the project root.")
        sys.exit(1)
    
    print("🎵 Scanning audio directory...")
    print(f"   Directory: {audio_dir.absolute()}")
    
    manifest = {"languages": {}}
    total_songs = 0
    
    # Scan each language directory
    for language_dir in sorted(audio_dir.iterdir()):
        if not language_dir.is_dir():
            print(f"⚠️  Skipping non-directory: {language_dir.name}")
            continue
        
        language_name = language_dir.name
        songs = []
        
        print(f"\n📁 Processing language: {language_name}")
        
        # Find all supported audio files in this language directory
        audio_files = []
        audio_files.extend(list(language_dir.glob("*.mp3")))
        audio_files.extend(list(language_dir.glob("*.opus")))
        
        if not audio_files:
            print(f"   ⚠️  No MP3 or OPUS files found in {language_name}")
            continue
        
        # Process each audio file
        for audio_file in sorted(audio_files):
            # Store both title and extension
            song_title = audio_file.stem
            song_extension = audio_file.suffix.lower()
            
            # Create song entry with format information
            song_entry = {
                "title": song_title,
                "format": song_extension[1:]  # Remove the dot from extension
            }
            
            songs.append(song_entry)
            
            # Add warning for OPUS files about browser compatibility
            if song_extension.lower() == '.opus':
                print(f"   ✅ Found: {song_title}{song_extension} ⚠️  (Note: OPUS support varies by browser)")
            else:
                print(f"   ✅ Found: {song_title}{song_extension}")
        
        if songs:
            manifest["languages"][language_name] = songs
            total_songs += len(songs)
            print(f"   📊 Total songs in {language_name}: {len(songs)}")
            
            # Check if there are OPUS files and show additional info
            opus_count = sum(1 for song in songs if song.get('format') == 'opus')
            if opus_count > 0:
                print(f"   ℹ️  OPUS files: {opus_count} (requires compatible browsers - Chrome, Firefox, Edge)")
    
    # Write manifest.json
    manifest_file = Path("manifest.json")
    
    try:
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Successfully generated manifest.json!")
        print(f"   File location: {manifest_file.absolute()}")
        print(f"   Total languages: {len(manifest['languages'])}")
        print(f"   Total songs: {total_songs}")
        
        # Check for OPUS files and show compatibility warning
        total_opus = 0
        for lang, songs in manifest["languages"].items():
            opus_count = sum(1 for song in songs if (isinstance(song, dict) and song.get('format') == 'opus'))
            total_opus += opus_count
        
        if total_opus > 0:
            print(f"\n⚠️  OPUS Compatibility Notice:")
            print(f"   Total OPUS files: {total_opus}")
            print(f"   OPUS is supported in Chrome, Firefox, Edge, and modern browsers")
            print(f"   Safari has limited OPUS support (requires CAF container in some versions)")
            print(f"   For maximum compatibility, also provide MP3 versions of OPUS files")
        
        # Show manifest preview
        print(f"\n📋 Manifest preview:")
        print("-" * 50)
        for lang, songs in manifest["languages"].items():
            print(f"{lang}: {len(songs)} songs")
            if songs:
                first_song = songs[0]
                if isinstance(first_song, dict):
                    print(f"  First song: {first_song['title']}.{first_song['format']}")
                else:
                    # Backward compatibility with old format
                    print(f"  First song: {first_song}.mp3")
                
                if len(songs) > 1:
                    last_song = songs[-1]
                    if isinstance(last_song, dict):
                        print(f"  Last song: {last_song['title']}.{last_song['format']}")
                    else:
                        # Backward compatibility with old format
                        print(f"  Last song: {last_song}.mp3")
        print("-" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Error writing manifest.json: {e}")
        return False

def validate_manifest():
    """Validate the generated manifest.json."""
    
    manifest_file = Path("manifest.json")
    
    if not manifest_file.exists():
        print("❌ manifest.json not found!")
        return False
    
    try:
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        print("\n🔍 Validating manifest...")
        
        # Check structure
        if "languages" not in manifest:
            print("❌ Missing 'languages' key in manifest")
            return False
        
        if not isinstance(manifest["languages"], dict):
            print("❌ 'languages' should be an object/dictionary")
            return False
        
        # Check each language
        for lang, songs in manifest["languages"].items():
            if not isinstance(songs, list):
                print(f"❌ Songs for '{lang}' should be an array/list")
                return False
            
            if not songs:
                print(f"⚠️  Warning: No songs found for language '{lang}'")
                continue
            
            # Check each song entry
            for song in songs:
                if isinstance(song, dict):
                    # New format with title and format
                    if "title" not in song or "format" not in song:
                        print(f"❌ Song entry missing 'title' or 'format': {song}")
                        return False
                    
                    if not isinstance(song["title"], str) or not isinstance(song["format"], str):
                        print(f"❌ Song title and format should be strings: {song}")
                        return False
                    
                    if song["format"] not in ["mp3", "opus"]:
                        print(f"⚠️  Warning: Unsupported format '{song['format']}' for song '{song['title']}'")
                    
                elif isinstance(song, str):
                    # Old format - just a string (backward compatibility)
                    if song.endswith('.mp3') or song.endswith('.opus'):
                        print(f"⚠️  Warning: Song '{song}' includes file extension (should be in format field)")
                else:
                    print(f"❌ Invalid song entry type: {song}")
                    return False
        
        print("✅ Manifest validation passed!")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in manifest.json: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading manifest.json: {e}")
        return False

def main():
    """Main function."""
    
    print("🎼 Audalithic Audio Manifest Generator")
    print("=" * 50)
    
    # Generate manifest
    if not generate_manifest():
        sys.exit(1)
    
    # Validate manifest
    if not validate_manifest():
        sys.exit(1)
    
    print("\n🎉 All done!")
    print("\nNext steps:")
    print("1. Upload manifest.json to your music server root")
    print("2. Upload the entire public/audio/ directory to your music server")
    print("3. Test the URLs:")
    print("   - https://aiaudio.uzay.me/manifest.json")
    print("   - https://aiaudio.uzay.me/audio/English/[song-name].mp3")
    print("   - https://aiaudio.uzay.me/audio/English/[song-name].opus")
    print("\n🚀 Your Audalithic app should now work with remote music!")

if __name__ == "__main__":
    main() 