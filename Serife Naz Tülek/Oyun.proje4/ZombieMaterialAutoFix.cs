using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

[ExecuteAlways]
public class ZombieMaterialAutoFix : MonoBehaviour
{
    public bool ApplyNow;

    [Header("Material Names")]
    public string bodyMaterialName = "ZombieGirl_body_Material";
    public string clothesMaterialName = "ZombieGirl_Material";

    void Update()
    {
        if (ApplyNow)
        {
            ApplyNow = false;
            ApplyZombieMaterials();
        }
    }

    public void ApplyZombieMaterials()
    {
        Material bodyMat = FindMaterialByName(bodyMaterialName);
        Material clothesMat = FindMaterialByName(clothesMaterialName);

        Renderer[] renderers = GetComponentsInChildren<Renderer>(true);

        foreach (Renderer renderer in renderers)
        {
            string objName = renderer.gameObject.name.ToLower();

            if (objName.Contains("body"))
            {
                if (bodyMat != null)
                {
                    renderer.sharedMaterial = bodyMat;
                    Debug.Log("Body material atandı: " + renderer.gameObject.name);
                }
            }
            else if (objName.Contains("pants") || objName.Contains("top"))
            {
                if (clothesMat != null)
                {
                    renderer.sharedMaterial = clothesMat;
                    Debug.Log("Clothes material atandı: " + renderer.gameObject.name);
                }
            }
        }

        Debug.Log("Zombie materyalleri otomatik atandı.");
    }

    Material FindMaterialByName(string materialName)
    {
#if UNITY_EDITOR
        string[] guids = AssetDatabase.FindAssets(materialName + " t:Material");

        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);

            if (mat != null && mat.name == materialName)
            {
                return mat;
            }
        }
#endif

        Debug.LogWarning("Materyal bulunamadı: " + materialName);
        return null;
    }
}