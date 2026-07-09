using UnityEngine;

[ExecuteAlways]
public class ZombieColorFix : MonoBehaviour
{
    [Header("Zombie Colors")]
    public Color bodyColor = new Color(0.55f, 0.62f, 0.58f, 1f);
    public Color topColor = new Color(0.35f, 0.02f, 0.02f, 1f);
    public Color pantsColor = new Color(0.04f, 0.04f, 0.04f, 1f);

    void OnEnable()
    {
        ApplyColors();
    }

    void Start()
    {
        ApplyColors();
    }

    void OnValidate()
    {
        ApplyColors();
    }

    public void ApplyColors()
    {
        Renderer[] renderers = GetComponentsInChildren<Renderer>(true);

        foreach (Renderer r in renderers)
        {
            string n = r.gameObject.name.ToLower();

            Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));

            if (n.Contains("body"))
            {
                mat.name = "Zombie_Body_Auto";
                mat.SetColor("_BaseColor", bodyColor);
                r.sharedMaterial = mat;
            }
            else if (n.Contains("top"))
            {
                mat.name = "Zombie_Top_Auto";
                mat.SetColor("_BaseColor", topColor);
                r.sharedMaterial = mat;
            }
            else if (n.Contains("pants"))
            {
                mat.name = "Zombie_Pants_Auto";
                mat.SetColor("_BaseColor", pantsColor);
                r.sharedMaterial = mat;
            }
        }
    }
}