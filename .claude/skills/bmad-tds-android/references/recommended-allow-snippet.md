# Android / Kotlin — recommended `.claude/settings.local.json` allow patterns

Copy-paste в свой `.claude/settings.local.json` (под `permissions.allow`)
чтобы pre-approve typical Android dev-cycle commands. Patterns — Claude
Code prefix-matching, `*` в конце = «любые args».

```json
{
  "permissions": {
    "allow": [
      "Bash(./gradlew *)",
      "Bash(./gradlew assembleDebug *)",
      "Bash(./gradlew assembleDebug)",
      "Bash(./gradlew assembleRelease *)",
      "Bash(./gradlew test *)",
      "Bash(./gradlew test)",
      "Bash(./gradlew connectedAndroidTest *)",
      "Bash(./gradlew lint *)",
      "Bash(./gradlew lintDebug *)",
      "Bash(./gradlew check *)",
      "Bash(./gradlew clean *)",
      "Bash(./gradlew clean)",
      "Bash(./gradlew dependencies *)",
      "Bash(./gradlew installDebug *)",
      "Bash(./gradlew installDebug)",
      "Bash(./gradlew bundleRelease *)",
      "Bash(./gradlew --version)",
      "Bash(adb *)",
      "Bash(adb devices)",
      "Bash(adb install *)",
      "Bash(adb uninstall *)",
      "Bash(adb logcat *)",
      "Bash(adb shell *)",
      "Bash(adb push *)",
      "Bash(adb pull *)",
      "Bash(emulator *)",
      "Bash(apksigner *)",
      "Bash(zipalign *)",
      "Bash(ktlint *)",
      "Bash(detekt *)"
    ]
  }
}
```

## Известные ограничения

Claude Code permission engine — **strict prefix match**:

- Wildcards `*` работают **в конце** pattern'а или в command body
  (`./gradlew test *` matches `./gradlew test --tests 'com.foo.BarTest'`).
- Wildcards в **середине / начале** не работают.
- **Compound chains** (`./gradlew assembleDebug && adb install ...`)
  каждая unique string. См. Шаг 4e в `bmad-tds-execute-story` SKILL.md —
  recommended избегать compound.

## Альтернатива: shell rc / direnv / sdkman

```sh
# .envrc (project-root)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
export GRADLE_OPTS="-Xmx4g -XX:MaxMetaspaceSize=512m"
```

После `direnv allow` env установлены при `cd`. `./gradlew` standalone
match'ит pre-allowed pattern. JDK toggle через `sdkman` (`.sdkmanrc`).
