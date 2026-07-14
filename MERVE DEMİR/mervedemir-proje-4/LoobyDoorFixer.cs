using UnityEngine;

[ExecuteAlways]
public class LobbyDoorFixer : MonoBehaviour
{
    [Header("Kapı Geçişini Aç")]
    public bool OpenDoorNow;

    [Header("Orta kapı açıklığı ayarı")]
    public float centerX = 0f;
    public float frontZ = -12f;
    public float openingWidth = 4f;
    public float openingHeight = 4f;
    public float openingDepth = 3f;

    void Update()
    {
        if (OpenDoorNow)
        {
            OpenDoorNow = false;
            OpenMiddleDoor();
        }
    }

    void OpenMiddleDoor()
    {
        Collider[] allColliders = GetComponentsInChildren<Collider>(true);
        Renderer[] allRenderers = GetComponentsInChildren<Renderer>(true);

        foreach (Collider col in allColliders)
        {
            Vector3 p = col.bounds.center;

            bool isInMiddleOpening =
                Mathf.Abs(p.x - centerX) <= openingWidth &&
                p.y >= 0f &&
                p.y <= openingHeight &&
                Mathf.Abs(p.z - frontZ) <= openingDepth;

            if (isInMiddleOpening)
            {
                col.enabled = false;
                Debug.Log("Kapı geçiş collider kapatıldı: " + col.gameObject.name);
            }
        }

        foreach (Renderer rend in allRenderers)
        {
            Vector3 p = rend.bounds.center;

            bool isInMiddleOpening =
                Mathf.Abs(p.x - centerX) <= openingWidth &&
                p.y >= 0f &&
                p.y <= openingHeight &&
                Mathf.Abs(p.z - frontZ) <= openingDepth;

            string n = rend.gameObject.name.ToLower();

            bool looksLikeDoorOrGlass =
                n.Contains("glass") ||
                n.Contains("door") ||
                n.Contains("frame") ||
                n.Contains("entrance") ||
                n.Contains("window");

            if (isInMiddleOpening && looksLikeDoorOrGlass)
            {
                rend.enabled = false;
                Debug.Log("Kapı geçiş görünmez yapıldı: " + rend.gameObject.name);
            }
        }

        Debug.Log("ORTA KAPI GEÇİŞİ AÇILDI.");
    }
}