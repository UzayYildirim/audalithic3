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
        
        # Find all MP3 audio files in this language directory
        audio_files = list(language_dir.glob("*.mp3"))
        
        if not audio_files:
            print(f"   ⚠️  No MP3 files found in {language_name}")
            continue
        
        # Process each audio file
        for audio_file in sorted(audio_files):
            # Store just the title (without extension)
            song_title = audio_file.stem
            
            songs.append(song_title)
            print(f"   ✅ Found: {song_title}.mp3")
        
        if songs:
            manifest["languages"][language_name] = songs
            total_songs += len(songs)
            print(f"   📊 Total songs in {language_name}: {len(songs)}")
    
    # Write manifest.json
    manifest_file = Path("manifest.json")
    
    try:
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Successfully generated manifest.json!")
        print(f"   File location: {manifest_file.absolute()}")
        print(f"   Total languages: {len(manifest['languages'])}")
        print(f"   Total songs: {total_songs}")
        
        # Show manifest preview
        print(f"\n📋 Manifest preview:")
        print("-" * 50)
        for lang, songs in list(manifest["languages"].items())[:3]:  # Show first 3 languages
            print(f"{lang}: {len(songs)} songs")
            for song in songs[:3]:  # Show first 3 songs per language
                print(f"  - {song}")
            if len(songs) > 3:
                print(f"  ... and {len(songs) - 3} more")
        
        if len(manifest["languages"]) > 3:
            remaining_langs = len(manifest["languages"]) - 3
            print(f"... and {remaining_langs} more languages")
        
        print("-" * 50)
        
        return True
    except Exception as e:
        print(f"❌ Error writing manifest.json: {e}")
        return False

def validate_manifest():
    """Validate the generated manifest.json."""
    try:
        if not Path("manifest.json").exists():
            print("❌ manifest.json not found")
            return False
        
        with open("manifest.json", 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        if "languages" not in manifest:
            print("❌ manifest.json missing 'languages' key")
            return False
        
        if not isinstance(manifest["languages"], dict):
            print("❌ 'languages' should be an object/dict")
            return False
        
        for lang, songs in manifest["languages"].items():
            if not isinstance(lang, str):
                print(f"❌ Language key should be a string: {lang}")
                return False
            
            if not isinstance(songs, list):
                print(f"❌ Songs for '{lang}' should be an array/list")
                return False
            
            if not songs:
                print(f"⚠️  Warning: No songs found for language '{lang}'")
                continue
            
            # Check each song entry
            for song in songs:
                if not isinstance(song, str):
                    print(f"❌ Song entry should be a string: {song}")
                    return False
                    
                if song.endswith('.mp3'):
                    print(f"⚠️  Warning: Song '{song}' includes file extension (should be title only)")
        
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
    print("\n🚀 Your Audalithic app should now work with remote music!")

if __name__ == "__main__":
    main() 