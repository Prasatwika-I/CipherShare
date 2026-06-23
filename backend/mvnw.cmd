@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script, version 3.2.0
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir=[System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath('%~f0')); $PropertiesFile = Join-Path $scriptDir '.mvn/wrapper/maven-wrapper.properties'; if (Test-Path $PropertiesFile) { Get-Content $PropertiesFile | Where-Object {$_ -match '^distributionUrl='} | ForEach-Object {$_.substring(16)} } }"`) DO (
  @SET MVNW_REPOURL=%%A
)
@SET PSModulePath=%__MVNW_PSMODULEP_SAVE%

@SET __MVNW_PSMODULEP_SAVE=
@IF "%MVNW_REPOURL%"=="" (
  @SET MVNW_REPOURL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
)

@SET MAVEN_USER_HOME=%USERPROFILE%\.m2\wrapper
@SET MVN_CMD=%MAVEN_USER_HOME%\dists\apache-maven-3.9.6\bin\mvn.cmd

@IF NOT EXIST "%MVN_CMD%" (
  @ECHO Downloading Maven 3.9.6 to %MAVEN_USER_HOME%...
  @powershell -noprofile -Command "& { $url='%MVNW_REPOURL%'; $dest='%MAVEN_USER_HOME%\dists\apache-maven-3.9.6-bin.zip'; New-Item -ItemType Directory -Force -Path '%MAVEN_USER_HOME%\dists' | Out-Null; Invoke-WebRequest -Uri $url -OutFile $dest; Expand-Archive -Path $dest -DestinationPath '%MAVEN_USER_HOME%\dists' -Force; Remove-Item $dest }"
)

@IF NOT EXIST "%MVN_CMD%" (
  @ECHO ERROR: Maven could not be downloaded. Check your internet connection.
  @EXIT /B 1
)

@"%MVN_CMD%" %*
