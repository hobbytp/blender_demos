# Regenerate local Mandarin narration. Uses the installed Windows voice, no API key.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$pilotRoot = Split-Path $PSScriptRoot -Parent
$pilotLines = Get-Content -Raw -Encoding UTF8 (Join-Path $pilotRoot 'src/narration.json') | ConvertFrom-Json
$pilotAudioDir = Join-Path $pilotRoot 'public/audio'
New-Item -ItemType Directory -Force -Path $pilotAudioDir | Out-Null
$pilotSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$pilotSynth.SelectVoice('Microsoft Huihui Desktop')
try {
    for ($pilotIndex = 0; $pilotIndex -lt $pilotLines.Count; $pilotIndex++) {
        $pilotLine = $pilotLines[$pilotIndex]
        $pilotBudget = $pilotLine.end - $pilotLine.start - 0.15
        for ($pilotRate = 1; $pilotRate -le 3; $pilotRate++) {
            $pilotStream = New-Object System.IO.MemoryStream
            $pilotSynth.Rate = $pilotRate
            $pilotSynth.SetOutputToWaveStream($pilotStream)
            $pilotSynth.Speak($pilotLine.spoken)
            $pilotSynth.SetOutputToNull()
            $pilotBytes = $pilotStream.ToArray()
            $pilotStream.Dispose()
            $pilotDataBytes = 0
            $pilotByteRate = 0
            for ($pilotOffset = 12; $pilotOffset + 8 -le $pilotBytes.Length;) {
                $pilotChunkSize = [BitConverter]::ToUInt32($pilotBytes, $pilotOffset + 4)
                $pilotChunk = [Text.Encoding]::ASCII.GetString($pilotBytes, $pilotOffset, 4)
                if ($pilotChunk -eq 'fmt ') { $pilotByteRate = [BitConverter]::ToUInt32($pilotBytes, $pilotOffset + 16) }
                if ($pilotChunk -eq 'data') {
                    $pilotDataBytes = $pilotChunkSize
                    break
                }
                $pilotOffset += 8 + $pilotChunkSize + ($pilotChunkSize % 2)
            }
            if ($pilotDataBytes -eq 0 -or $pilotByteRate -eq 0) { throw 'No WAV audio returned by the installed voice.' }
            $pilotSeconds = $pilotDataBytes / $pilotByteRate
            if ($pilotSeconds -le $pilotBudget) { break }
        }
        if ($pilotSeconds -gt $pilotBudget) { throw "Narration segment $pilotIndex exceeds its time slot." }
        $pilotFilename = '{0:d2}.wav' -f ($pilotIndex + 1)
        [IO.File]::WriteAllBytes((Join-Path $pilotAudioDir $pilotFilename), $pilotBytes)
        Write-Output ("{0}: {1:N2}s / {2:N2}s, voice rate {3}" -f $pilotFilename, $pilotSeconds, $pilotBudget, $pilotRate)
    }
} finally { $pilotSynth.Dispose() }
