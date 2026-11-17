; Extra steps for the Windows installer and uninstaller (electron-builder's nsis.include).
;
; CyberDojo 0.3.0 and older let the built-in server save every page it rendered inside the
; install folder, in resources\server\.next-desktop\server\route-cache. Those paths pass
; Windows' 260-character limit, so the old version's uninstaller can't remove them, and an
; update or a reinstall stopped with "CyberDojo cannot be closed". `rd` given a \\?\ path
; can remove them, so the folder goes before the old version is uninstalled.
; Newer versions keep that cache in memory (next.config.ts), so this only cleans up old installs.

!macro cyberdojoRemovePageCache
  ${If} ${FileExists} "$INSTDIR\resources\server\.next-desktop\server\route-cache\*.*"
    DetailPrint "Removing the page cache left by an older CyberDojo"
    nsExec::Exec `"$SYSDIR\cmd.exe" /C rd /s /q "\\?\$INSTDIR\resources\server\.next-desktop\server\route-cache"`
    Pop $0
  ${EndIf}
!macroend

; The installer: runs once the install folder is known (the previous one, from the registry).
!macro customInit
  !insertmacro cyberdojoRemovePageCache
!macroend

; The uninstaller, run from Windows' settings or by a newer installer.
!macro customUnInit
  !insertmacro cyberdojoRemovePageCache
!macroend
