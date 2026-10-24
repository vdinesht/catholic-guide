package org.catholicguide.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "languages")
public class Language {

    @Id
    private String code;

    @Column(nullable = false)
    private String nativeName;

    @Column(nullable = false)
    private String englishName;

    private boolean enabled;

    private boolean isDefault;

    /** Latin, for example, is used for hymns only: readings and prayers get no tab for it. */
    private boolean songsOnly;

    private int position;

    protected Language() {}

    public Language(String code, String nativeName, String englishName, int position) {
        this.code = code;
        this.nativeName = nativeName;
        this.englishName = englishName;
        this.position = position;
        this.enabled = true;
    }

    public String getCode() { return code; }
    public String getNativeName() { return nativeName; }
    public String getEnglishName() { return englishName; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public boolean isDefault() { return isDefault; }
    public boolean isSongsOnly() { return songsOnly; }
    public void setSongsOnly(boolean songsOnly) { this.songsOnly = songsOnly; }
    public int getPosition() { return position; }
}
