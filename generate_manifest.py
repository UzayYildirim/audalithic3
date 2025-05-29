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
        
        # Find all MP3 files in this language directory
        mp3_files = list(language_dir.glob("*.mp3"))
        
        if not mp3_files:
            print(f"   ⚠️  No MP3 files found in {language_name}")
            continue
        
        for mp3_file in sorted(mp3_files):
            # Remove .mp3 extension for manifest
            song_title = mp3_file.stem
            songs.append(song_title)
            print(f"   ✅ Found: {song_title}")
        
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
        for lang, songs in manifest["languages"].items():
            print(f"{lang}: {len(songs)} songs")
            if songs:
                print(f"  First song: {songs[0]}")
                if len(songs) > 1:
                    print(f"  Last song: {songs[-1]}")
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
            
            # Check for invalid characters in song names
            for song in songs:
                if not isinstance(song, str):
                    print(f"❌ Song title should be string: {song}")
                    return False
                
                if song.endswith('.mp3'):
                    print(f"⚠️  Warning: Song '{song}' includes .mp3 extension (should be removed)")
        
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